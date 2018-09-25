CCMeteorCamera.getPicture = function (options, callback) {
  // if options are not passed
  if (! callback) {
    callback = options;
    options = {};
  }

  var success = function (imageURI) {
    callback(null, imageURI);
  };

  var failure = function (error) {
    console.log(error);
    callback(new Meteor.Error("cordovaError", error));
  };


  // Making assumption Device is always ready before Camera get's called
  console.log("DEVICE PLATFOMR: " + device.platform);

  if ( device.platform == "Android" ) {
    // Android Settings - Android pic saved in:  Device Storage -> Pictures
    navigator.camera.getPicture(success, failure, 
      _.extend(options, {
        quality: options.quality || 95,
        targetWidth: options.width || 600,
        targetHeight: options.height || 400,
        encodingType: Camera.EncodingType.PNG,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.DestinationType.SAVEDPHOTOALBUM,
        saveToPhotoAlbum: true
      })
    );
  }
  else {
    // iPhone Settings and other Platforms
    navigator.camera.getPicture(success, failure, 
      _.extend(options, {
        quality: options.quality || 95,
        targetWidth: options.width || 600,
        targetHeight: options.height || 400,
        encodingType: Camera.EncodingType.PNG,
        destinationType: Camera.DestinationType.NATIVE_URI,
        sourceType: Camera.DestinationType.PHOTOLIBRARY,
      })
    );
  }

  
};

