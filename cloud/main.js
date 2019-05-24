var Image = require('../helpers/image');

function saveImage (base64) {
  var parseFile = new Parse.File('image.jpg', { base64: base64 });
  return parseFile.save();
}

Parse.Cloud.define('getUsers', function (req, res) {

  var params = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    var query = new Parse.Query(Parse.User);

    if (params.filter != '') {
      query.contains('email', params.filter);
    }

    query.descending('createdAt');

    var queryUsers = query.find({ useMasterKey: true });
    var queryCount = query.count({ useMasterKey: true });

    return Parse.Promise.when(queryUsers, queryCount);
  }).then(function (users, total) {
    res.success({ users: users, total: total });
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('createUser', function (req, res) {

  var data = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    } else {

      var user = new Parse.User();
      user.set('name', data.name);
      user.set('username', data.email);
      user.set('email', data.email);
      user.set('password', data.password);
      user.set('photo', data.photo);
      user.set('roleName', 'Admin');

      var acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      user.setACL(acl);

      user.signUp().then(function (objUser) {
        res.success(objUser);
      }, function (error) {
        res.error(error);
      });
    }
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('updateUser', function (req, res) {

  var data = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    var query = new Parse.Query(Parse.User);
    query.equalTo('objectId', data.id);
    return query.first({ useMasterKey: true });
  }).then(function (objUser) {

    objUser.set('name', data.name);
    objUser.set('username', data.email);
    objUser.set('email', data.email);
    objUser.set('photo', data.photo);

    if (!data.password) {
      objUser.set('password', data.password);
    }

    return objUser.save(null, { useMasterKey: true });
  }).then(function (success) {
    res.success(success);
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('destroyUser', function (req, res) {

  var params = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    var query = new Parse.Query(Parse.User);
    query.equalTo('objectId', params.id);
    return query.first({ useMasterKey: true });
  }).then(function (objUser) {

    if (!objUser) {
      return res.error('User not found');
    }

    return objUser.destroy({ useMasterKey: true });
  }).then(function (success) {
    res.success(success);
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.beforeSave('Event', function(req, res) {

  var event = req.object;
  var user = req.user;

  if (!user) {
    return res.error('Not Authorized');
  }

  if (req.master) {
    return res.success();
  }

  // Validation rules.
  if (!event.get('title')) {
    return res.error('Title is required.');
  } else if (!event.get('description')) {
    return res.error('Description is required.');
  } else if (!event.get('image')) {
    return res.error('Image is required.');
  }

  // Access control
  if (!event.existed()) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setRoleWriteAccess('Admin', true);
    event.setACL(acl);
  }

  if (event.dirty('title') && event.get('title')) {
    event.set('canonical', event.get('title').toLowerCase());
  }

	if (!event.dirty('image')) {
	  return res.success(); // Image isn't being modified.
	}

  var url = event.get('image').url();

  Image.resize(url, 800, 510).then(function (base64) {
    return saveImage(base64);
  }).then(function (savedFile) {
    event.set('image', savedFile);
    return Image.resize(url, 480, 320);
  }).then(function (base64) {
    return saveImage(base64);
  }).then(function (savedFile) {
    event.set('imageThumb', savedFile);
    res.success();
  }, function (error) {
    res.error(error.message);
  });
});

Parse.Cloud.beforeSave('Sponsor', function (req, res) {

  var obj = req.object;
  var user = req.user;

  if (!user) {
    return res.error('Not Authorized');
  }

  if (req.master) {
    return res.success();
  }

  // Validation rules.
  if (!obj.get('name')) {
    return res.error('Name is required.');
  } else if (!obj.get('image')) {
    return res.error('Image is required.');
  }

  // Access control
  if (!obj.existed()) {
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setRoleWriteAccess('Admin', true);
    obj.setACL(acl);
  }

  if (obj.dirty('name') && obj.get('name')) {
    obj.set('canonical', obj.get('name').toLowerCase());
  }

	if (!obj.dirty('image')) {
	  return res.success(); // Image isn't being modified.
	}

  var url = obj.get('image').url();

  Image.resize(url, 480, 320).then(function (base64) {
    return saveImage(base64);
  }).then(function (savedFile) {
    obj.set('image', savedFile);
    res.success();
  }, function (error) {
    res.error(error.message);
  });
});

Parse.Cloud.beforeSave(Parse.User, function (req, res) {

  var user = req.object;

  if (user.existed() && user.dirty('roleName')) {
    return res.error('Role cannot be changed');
  }

  if (!user.get('photo') || !user.dirty('photo')) {
    return res.success();
  }

  var imageUrl = user.get('photo').url();

  Image.resize(imageUrl, 160, 160).then(function (base64) {
    return saveImage(base64);
  }).then(function (savedFile) {
    user.set('photo', savedFile);
    res.success();
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.afterSave(Parse.User, function (req) {

  var user = req.object;
  var userRequesting = req.user;

  if (!user.existed()) {

    var query = new Parse.Query(Parse.Role);
    query.equalTo('name', 'Admin');
    query.equalTo('users', userRequesting);
    query.first().then(function (isAdmin) {

      if (!isAdmin && user.get('roleName') === 'Admin') {
        return Parse.Promise.error(new Parse.Error(1, 'Not Authorized'));
      }

      var roleName = user.get('roleName') || 'User';

      var innerQuery = new Parse.Query(Parse.Role);
      innerQuery.equalTo('name', roleName);
      return innerQuery.first();
    }).then(function (role) {

      if (!role) {
        return Parse.Promise.error(new Parse.Error(1, 'Role not found'));
      }

      role.getUsers().add(user);
      return role.save();
    });
  }
});
