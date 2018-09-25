import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';
import { AccountsModule } from 'angular2-meteor-accounts-ui';
import { AgmCoreModule } from '@agm/core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home';

import { routes, ROUTES_PROVIDERS } from './app.routes';
import { AUTH_PROVIDERS } from "./services-global/auth";

import { ServicesGlobalModule } from './services-global/services-global.module';

import { MatSnackBar } from "@angular/material";

import { AppCustomPreloader } from './app.routes.loader';


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: AppCustomPreloader }),
    AccountsModule,
    BrowserAnimationsModule,
    BrowserModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCav3xW1eBqKqQVQqq9CGDFYnS9B2L2Sl0',
      libraries: ['places']
    }),
    ServicesGlobalModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    HomeComponent,
  ],
  providers: [
    ...AUTH_PROVIDERS,
    ...ROUTES_PROVIDERS,
    AppCustomPreloader,
    MatSnackBar,
  ],
  bootstrap: [
    AppComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule {}