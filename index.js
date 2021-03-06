var express = require('express');
var ParseServer = require('parse-server').ParseServer;
const ParseDashboard = require('parse-dashboard')
var S3Adapter = require('parse-server').S3Adapter;
var expressLayouts = require('express-ejs-layouts');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var cookieSession = require('cookie-session');
var MailgunHelper = require('./helpers/mailgun-helper').MailgunHelper;
var Mailgen = require('mailgen');
var FSFilesAdapter = require('parse-server-fs-adapter');


// Parse configuration
var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI || process.env.MONGO_URL;
var publicServerUrl = process.env.PUBLIC_SERVER_URL || 'http://localhost:1337/parse';
var appId = process.env.APP_ID || 'myAppId';
var masterKey = process.env.MASTER_KEY || 'myMasterKey';
var appName = process.env.APP_NAME || 'My Event App';

// Mailgun configuration
var apiKey = process.env.MAILGUN_API_KEY || 'key-004454825826125a446123cf1ca7d3c3';
var domain = process.env.MAILGUN_DOMAIN || 'sandbox7687377b23a24d4bac653eb7dc57e046.mailgun.org';
var fromAddress = process.env.MAILGUN_FROM_ADDRESS || 'QuanLabs <dev@quanlabs.com>';
var toAddress = process.env.MAILGUN_TO_ADDRESS || 'dev@quanlabs.com';

// AWS S3 configuration
var accessKeyId = process.env.AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var bucketName = process.env.BUCKET_NAME;

var filesAdapter = new FSFilesAdapter();

if (accessKeyId && secretAccessKey && bucketName) {
  filesAdapter = new S3Adapter(
    accessKeyId, secretAccessKey, bucketName, { directAccess: true });
}

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var mailgunHelper = new MailgunHelper({
  apiKey: apiKey,
  domain: domain,
  fromAddress: fromAddress,
  toAddress: toAddress
});

var mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: appName,
    link: publicServerUrl
  }
});

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/events',
  cloud: __dirname + '/cloud/main.js',
  appId: appId,
  masterKey: masterKey,
  serverURL: `http://localhost:${process.env.PORT}/parse`,
  filesAdapter: filesAdapter,
  verifyUserEmails: false,
  publicServerURL: publicServerUrl,
  appName: appName,
  emailAdapter: {
    module: 'parse-server-simple-mailgun-adapter',
    options: {
      fromAddress: fromAddress,
      domain: domain,
      apiKey: apiKey,
    }
  }
});

// Parse Dashboard
// https://github.com/parse-community/parse-dashboard

const dashboard = new ParseDashboard({
  apps: [
    {
      serverURL: process.env.PUBLIC_SERVER_URL,
      appId: process.env.APP_ID,
      masterKey: process.env.MASTER_KEY,
      appName: process.env.APP_NAME,
      production: true,
    }
  ],
  users: [
    {
      user: process.env.PARSE_DASHBOARD_USER,
      pass: process.env.PARSE_DASHBOARD_PASS
    },
  ],
  useEncryptedPasswords: true,
  trustProxy: 1
}, { allowInsecureHTTP: true, cookieSessionSecret: process.env.MASTER_KEY });

var app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Serve the Parse Dashboard on the /dashboard URL prefix
app.use('/parse-dashboard', dashboard);

app.use(express.static('public'));
app.use(expressLayouts);
app.use(cookieParser());
app.use(methodOverride());

app.use(cookieSession({
  name: process.env.APP_ID + '.sess',
  secret: process.env.MASTER_KEY,
  maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
}))

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.page = req.url.split('/').pop();
  res.locals.appId = appId;
  res.locals.serverUrl = publicServerUrl;
  next();
});

var isNotInstalled = function (req, res, next) {

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return Parse.Promise.error(new Parse.Error(5000, 'Admin Role not found'));
    }

    var userRelation = adminRole.relation('users');
    return userRelation.query().count({ useMasterKey: true });
  }).then(function (count) {

    if (count === 0) {
      next();
    } else {
      req.session = null;
      res.redirect('/login');
    }
  }, function (error) {
    if (error.code === 5000) {
      next();
    } else {
      req.session = null;
      res.redirect('/login');
    }
  })
}

var isAdmin = function (req, res, next) {

  var objUser;

  return Parse.Cloud.httpRequest({
    url: `http://localhost:${process.env.PORT}/parse/users/me`,
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-Session-Token': req.session.token
    }
  }).then(function (userData) {

    objUser = Parse.Object.fromJSON(userData.data);

    var query = new Parse.Query(Parse.Role);
    query.equalTo('name', 'Admin');
    query.equalTo('users', objUser);
    return query.first();

  }).then(function (isAdmin) {

    if (!isAdmin) {
      return Parse.Promise.error();
    }

    req.user = objUser;
    return next();

  }).then(null, function () {
    req.session = null;
    res.redirect('/login');
  });
}

var isNotAuthenticated = function (req, res, next) {

  Parse.Cloud.httpRequest({
    url: `http://localhost:${process.env.PORT}/parse/users/me`,
    headers: {
      'X-Parse-Application-Id': appId,
      'X-Parse-Session-Token': req.session.token
    }
  }).then(function (userData) {
    res.redirect('/dashboard/events');
  }, function (error) {
    next();
  });
}

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/install', isNotInstalled, function (req, res) {
  res.render('install');
});

app.post('/install', [urlencodedParser, isNotInstalled], function (req, res) {

  var name = req.body.name.trim();
  var username = req.body.username.toLowerCase().trim();
  var password = req.body.password.trim();
  var passwordConfirmation = req.body.passwordConfirmation.trim();

  if (!name) {
    return res.render('install', {
      flash: 'Name is required',
      input: req.body
    });
  }

  if (!username) {
    return res.render('install', {
      flash: 'Email is required',
      input: req.body
    });
  }

  if (password !== passwordConfirmation) {
    return res.render('install', {
      flash: "Password doesn't match",
      input: req.body
    });
  }

  if (password.length < 6) {
    return res.render('install', {
      flash: 'Password should be at least 6 characters',
      input: req.body
    });
  }

  var roles = [];

  var roleACL = new Parse.ACL();
  roleACL.setPublicReadAccess(true);

  var role = new Parse.Role('Admin', roleACL);
  roles.push(role);
  var role = new Parse.Role('User', roleACL);
  roles.push(role);

  var user = new Parse.User();
  user.set('name', name);
  user.set('username', username);
  user.set('email', username);
  user.set('password', password);
  user.set('roleName', 'Admin');
  user.set('photoThumb', undefined);

  var acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  user.setACL(acl);

  var query = new Parse.Query(Parse.Role);

  query.find().then(function (objRoles) {
    return Parse.Object.destroyAll(objRoles, { useMasterKey: true });
  }).then(function () {
    return Parse.Object.saveAll(roles);
  }).then(function () {
    return user.signUp();
  }).then(function (objUser) {

    req.session.user = objUser;
    req.session.token = objUser.getSessionToken();
    res.redirect('/dashboard/events');
  }, function (error) {
    res.render('install', {
      flash: error.message,
      input: req.body
    });
  });
});

app.get('/', function (req, res) {
  res.redirect('/login');
});

app.get('/login', isNotAuthenticated, function (req, res) {
  res.render('login');
});

app.get('/reset-password', isNotAuthenticated, function (req, res) {
  res.render('reset-password');
});

app.get('/dashboard/events', isAdmin, function (req, res) {
  res.render('events');
});

app.get('/dashboard/sponsors', isAdmin, function (req, res) {
  res.render('sponsors');
});

app.get('/dashboard/users', isAdmin, function (req, res) {
  res.render('users');
});

app.post('/contact', urlencodedParser, function (req, res) {

  var name = req.body.name.trim();
  var email = req.body.email.toLowerCase().trim();
  var message = req.body.message.trim();

  if (!name || !email || !message) {
    res.status(400);
    return res.json({
      success: false
    });
  }

  mailgunHelper.send({
    html: mailGenerator.generate({
      body: {
        name: 'there',
        intro: [
          'You have a new message!',
          'From: ' + name  + ' (' + email + ')',
          'Message: ' + message
        ]
      }
    }),
    subject: 'Contact from ' + appName,
    from: email
  });

  res.json({ success: true });
});

// Logs in the user
app.post('/login', [urlencodedParser, isNotAuthenticated], function (req, res) {

  var username = req.body.username;
  var password = req.body.password;

  Parse.User.logIn(username, password).then(function (user) {

    var query = new Parse.Query(Parse.Role);
    query.equalTo('name', 'Admin');
    query.equalTo('users', user);
    query.first().then(function (isAdmin) {

      if (!isAdmin) {
        res.render('login', {
          flash: 'Not Authorized'
        });
      } else {
        req.session.user = user;
        req.session.token = user.getSessionToken();
        res.redirect('/dashboard/events');
      }

    }, function (error) {
      res.render('login', {
        flash: error.message
      });
    });
  }, function (error) {
    res.render('login', {
      flash: error.message
    });
  });
});

app.get('/logout', isAdmin, function (req, res) {
  req.session = null;
  res.redirect('/login');
});

var port = process.env.PORT || 1337;
app.listen(port, function() {
  console.log(appName + ' running on port ' + port + '.');
});
