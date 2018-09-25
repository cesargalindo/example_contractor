// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
    id: 'com.zojab.vutilo',
    name: 'ZoJab-dev',
    description: 'Get ZoJab power in one button click',
    author: 'ZoJab Development Group',
    email: 'contact@example.com',
    website: 'https://zojab.com'
});

App.setPreference('BackgroundColor', '0xff0000ff');
App.setPreference('Orientation', 'default');
App.setPreference('Orientation', 'all', 'ios');

// Cordova translation error - add these params in android {} section in .meteor/local/cordova-build/platforms/android/build.gradle
// lintOptions {
//     abortOnError false
//     disable 'MissingTranslation'
//     disable 'ExtraTranslation'
// }

// FIX cordova-plugin-photos@1.0.8  -- If your project is Gradle-driven, just open your project's build.gradle script and replace JavaVersion.VERSION_1_6 to JavaVersion.VERSION_1_7, like that:
// 	compileOptions {
// 		sourceCompatibility JavaVersion.VERSION_1_7
// 		targetCompatibility JavaVersion.VERSION_1_7
// 	}


// PLACES ANDROID PERMISSIONS IN  .meteor/local/cordova-build/platforms/android/AndroidManifest.xml
// <uses-permission android:name="android.permission.INTERNET" />
// <uses-permission android:name="android.permission.NETWORK_ACCESS" />
// <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
// <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
// <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
// <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
// <uses-permission android:name="android.permission.ACCESS_LOCATION_EXTRA_COMMANDS" />
// <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
// <uses-permission android:name="android.permission.CAMERA" />
// <uses-permission android:name="android.permission.FLASHLIGHT" />



// Set up resources such as icons and launch screens.
App.icons({
    // iOS Icons
    'app_store': 'res/icon.png',
    'iphone_2x': 'res/icons/ios/icon-60@2x.png',
    'iphone_3x': 'res/icons/ios/icon-60@3x.png',
    'ipad_2x': 'res/icons/ios/icon-76@2x.png',
    'ipad_pro': 'res/icons/ios/icon-167.png',
    'ios_settings_2x': 'res/icons/ios/icon-small@2x.png',
    'ios_settings_3x': 'res/icons/ios/icon-60.png',
    'ios_spotlight_2x': 'res/icons/ios/icon-40@2x.png',
    'ios_spotlight_3x': 'res/icons/ios/icon-60@2x.png',
    'ios_notification_2x': 'res/icons/ios/icon-40.png',
    'ios_notification_3x': 'res/icons/ios/icon-60.png',
    'ipad': 'res/icons/ios/icon-76.png',
    'ios_settings': 'res/icons/ios/icon-small.png',
    'ios_spotlight': 'res/icons/ios/icon-40.png',
    // 'ios_notification': 'xx',
    'iphone_legacy': 'res/icons/ios/icon.png',
    'iphone_legacy_2x': 'res/icons/ios/icon@2x.png',
    'ipad_app_legacy': 'res/icons/ios/icon-72.png',
    'ipad_app_legacy_2x': 'res/icons/ios/icon-72@2x.png',

    // Android Icons
    'android_ldpi': 'res/icons/android/drawable-ldpi-icon.png',
    'android_mdpi': 'res/icons/android/drawable-mdpi-icon.png',
    'android_hdpi': 'res/icons/android/drawable-hdpi-icon.png',
    'android_xhdpi': 'res/icons/android/drawable-xhdpi-icon.png',
    'android_xxhdpi': 'res/icons/android/drawable-xxhdpi-icon.png',
    'android_xxxhdpi': 'res/icons/android/drawable-xxxhdpi-icon.png',
});

App.launchScreens({
    // iOS splashscreens
    'iphone5': 'res/screens/ios/Default-568h@2x~iphone.png',    
    'iphone6': 'res/screens/ios/Default-667h.png',
    'iphone6p_portrait': 'res/screens/ios/Default-Landscape-736h.png',
    'iphone6p_landscape': 'res/screens/ios/Default-736h.png',
    // iphoneX_portrait (1125x2436) // iPhone X    
    // 'iphoneX_portrait': 'xx',
    // iphoneX_landscape (2436x1125) // iPhone X    
    // 'iphoneX_landscape': 'xx',
    'ipad_portrait_2x': 'res/screens/ios/Default-Landscape@2x~ipad.png',
    'ipad_landscape_2x': 'res/screens/ios/Default-Portrait@2x~ipad.png',
    // ipad_portrait_pro_10_5 (1668x2224) // iPad Pro 10.5"    
    // 'ipad_portrait_pro_10_5': 'xx',
    // ipad_landscape_pro_10_5 (2224x1668) // iPad Pro 10.5"    
    // 'ipad_landscape_pro_10_5': 'xx',
    // ipad_portrait_pro_12_9 (2048x2732) // iPad Pro 12.9"    
    // 'ipad_portrait_pro_12_9': 'xx',
    // ipad_landscape_pro_12_9 (2732x2048) // iPad Pro 12.9"    
    // 'ipad_landscape_pro_12_9': 'xx',
    'iphone_2x': 'res/screens/ios/Default@2x~iphone.png',
    'ipad_portrait': 'res/screens/ios/Default-Landscape~ipad.png',
    'ipad_landscape': 'res/screens/ios/Default-Portrait~ipad.png',

    // Android Splashscreens
    'android_mdpi_portrait': 'res/screens/android/drawable-port-mdpi-screen.png',
    'android_mdpi_landscape': 'res/screens/android/drawable-land-mdpi-screen.png',
    'android_hdpi_portrait': 'res/screens/android/drawable-port-hdpi-screen.png',
    'android_hdpi_landscape': 'res/screens/android/drawable-land-hdpi-screen.png',
    'android_xhdpi_portrait': 'res/screens/android/drawable-port-xhdpi-screen.png',
    'android_xhdpi_landscape': 'res/screens/android/drawable-land-xhdpi-screen.png',
    'android_xxhdpi_portrait': 'res/screens/android/drawable-port-xxhdpi-screen.png',
    'android_xxhdpi_landscape': 'res/screens/android/drawable-land-xxhdpi-screen.png',
    'android_xxxhdpi_portrait': 'res/screens/android/drawable-port-xxxhdpi-screen.png',
    'android_xxxhdpi_landscape': 'res/screens/android/drawable-land-xxxhdpi-screen.png',
});


App.setPreference('BackupWebStorage', 'local');

App.accessRule('*', { type: 'navigation' });

//Starting with Meteor 1.0.4 access rule for all domains and protocols (<access origin="*"/>) is no longer set by default due to certain kind of possible attacks.
// App.accessRule("*");
App.accessRule("*://10.0.2.2/*");
App.accessRule("*://10.0.2.2:300/*");
App.accessRule("*://10.0.2.2:3000/*");

App.accessRule("*://127.0.0.1/*");
App.accessRule("*://127.0.0.1:3000/*");

App.accessRule("*://localhost/*");
App.accessRule("*://localhost:3000/*");
App.accessRule("*://localhost:12664/*");

App.accessRule("*://162.243.151.13:3000/*");

// Apollo
App.accessRule("*://localhost:8080/*");
App.accessRule("*://159.203.240.192:8080/graphq/*");

// SOCKET IO
// App.accessRule("*://cgsock.zojab.com:8181/*");

// Mongo
App.accessRule("*://104.236.183.162:34327/*");
App.accessRule("*://107.170.234.206:38574/*");


// XMLHttpRequest cannot load http:///sockjs/info?cb=ieu7ixlas4. Origin http://meteor.local is not allowed by Access-Control-Allow-Origin. myappname:1
App.accessRule("*://meteor.local/*");

// Amazon
App.accessRule('*://s3-us-west-2.amazonaws.com/*');

// Google Domain
App.accessRule('*://172.217.6.67/*');

// Google
App.accessRule('*://storage.googleapis.com/*');
App.accessRule('*://fonts.googleapis.com/*');
App.accessRule('*://maps.googleapis.com/*');
App.accessRule('*://maps.gstatic.com/*');
App.accessRule('*://fonts.gstatic.com/*');
App.accessRule('*://csi.gstatic.com/*');

