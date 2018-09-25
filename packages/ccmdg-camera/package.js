Package.describe({
  name: "ccmdg:camera",
  summary: "Photos with one function call on mobile.",
  version: "2.4.1"
});

Cordova.depends({
  "cordova-plugin-camera": "2.4.1",
  "cordova-plugin-photos": "1.0.8",
  "cordova-plugin-photo-library": "2.1.0",
  "cordova-plugin-file": "4.3.3",
});

Package.onUse(function(api) {
  api.export('CCMeteorCamera');
  api.versionsFrom("METEOR@1.5");

  api.addFiles('photo.js');
  api.addFiles('photo-client.js', ['web.cordova']);  
  api.addFiles('photo-cordova.js', ['web.cordova']);
});
