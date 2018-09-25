import 'angular2-meteor-polyfills';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { Meteor } from "meteor/meteor";
import { AppModule } from './imports/app/app.module';

enableProdMode();

Meteor.startup(() => {
    // console.warn('oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
    // let startupTime = Date.now() - window.performance.timing.responseStart;
    // console.warn('Meteor.startup took', startupTime, 'ms');
    // console.warn('oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
    platformBrowserDynamic().bootstrapModule(AppModule);
});

