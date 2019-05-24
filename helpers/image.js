var Jimp = require('jimp');

module.exports.resize = function (url, width, height) {

  return Jimp.read(url).then(function (image) {

    var imageResized = image.cover(width, height).quality(80);

    return imageResized.getBuffer(Jimp.MIME_JPEG, function (err, buffer) {
      var base64 = buffer.toString('base64');
      return new Parse.Promise.as(base64);
    })

  }).catch(function (err) {
    console.log(err);
    return Parse.Promise.error({
      message: 'Unable to read image',
      code: 200
    });
  });

}
