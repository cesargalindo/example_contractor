import { Meteor } from 'meteor/meteor';
import { Route } from '@angular/router';

import { HomeComponent } from './home/home';

import { AuthService } from './services-global/auth/auth.service';
import { AuthGuard } from './services-global/auth/auth-guard';
import { AuthGuardAdmin } from './services-global/auth/auth-guard-admin';
import { AuthGuardContractor } from './services-global/auth/auth-guard-contractor';

export function loadLandingPageModule() {
  return module.dynamicImport('./landing-page/landing-page.module').then(({LandingPageModule}) => LandingPageModule);
}
export function loadLandingPage2Module() {
  return module.dynamicImport('./landing-page2/landing-page2.module').then(({LandingPage2Module}) => LandingPage2Module);
}


export function loadLoginModule() {
  return module.dynamicImport('./auth/login/login.module').then(({LoginModule}) => LoginModule);
}
export function loadSignupModule() {
  return module.dynamicImport('./auth/signup/signup.module').then(({SignupModule}) => SignupModule);
}
export function loadRecoverModule() {
  return module.dynamicImport('./auth/recover/recover.module').then(({RecoverModule}) => RecoverModule);
}
export function loadResetModule() {
  return module.dynamicImport('./auth/reset/reset.module').then(({ResetModule}) => ResetModule);
}
export function loadSetPasswordModule() {
  return module.dynamicImport('./auth/setPassword/setPassword.module').then(({SetPasswordModule}) => SetPasswordModule);
}


export function loadNewItemModule() {
  return module.dynamicImport('./items/new-item/new-item.module').then(({NewItemModule}) => NewItemModule);
}
export function loadItemsConfirmedModule() {
  return module.dynamicImport('./items/confirmed/items-confirmed.module').then(({ItemsConfirmedModule}) => ItemsConfirmedModule);
}
export function loadItemsRejectedModule() {
  return module.dynamicImport('./items/rejected/items-rejected.module').then(({ItemsRejectedModule}) => ItemsRejectedModule);
}
export function loadItemsSubmittedModule() {
  return module.dynamicImport('./items/submitted/items-submitted.module').then(({ItemsSubmittedModule}) => ItemsSubmittedModule);
}


export function loadTransfersListModule() {
  return module.dynamicImport('./transfers/transfers-list.module').then(({TransfersListModule}) => TransfersListModule);
}
export function loadContractorSettingsModule() {
  return module.dynamicImport('./settings-page/contractor-settings/contractor-settings.module').then(({ContractorSettingsModule}) => ContractorSettingsModule);
}
export function loadContractorSettings2Module() {
  return module.dynamicImport('./settings-page/contractor-settings2/contractor-settings2.module').then(({ContractorSettings2Module}) => ContractorSettings2Module);
}

export function loadIssuesListModule() {
  return module.dynamicImport('./issues/issues-list.module').then(({IssuesListModule}) => IssuesListModule);
}

export function ScrapesNotFoundModule() {
  return module.dynamicImport('./scrapes/scrapes-not-found.module').then(({ScrapesNotFoundModule}) => ScrapesNotFoundModule);
}


export const routes: Route[] = [

  { path: '', redirectTo: 'init', pathMatch: 'full' },
  { path: 'init', component: HomeComponent },

  { path: 'landing', loadChildren: loadLandingPageModule, data: {preload: true} },
  
  { path: 'login', loadChildren: loadLoginModule, data: {preload: true} },
  { path: 'signup', loadChildren: loadSignupModule, data: {preload: true} },
  { path: 'recover', loadChildren: loadRecoverModule },
  { path: 'reset-password/:token', loadChildren: loadResetModule },
  { path: 'set-password', loadChildren: loadSetPasswordModule, canActivate: [AuthGuard] },

  { path: 'items-submitted', loadChildren: loadItemsSubmittedModule, canActivate: [AuthGuard] },
  { path: 'items-rejected', loadChildren: loadItemsRejectedModule, canActivate: [AuthGuard] },
  { path: 'new-item', loadChildren: loadNewItemModule, canActivate: [AuthGuard] },
  { path: 'item-confirmed', loadChildren: loadItemsConfirmedModule, canActivate: [AuthGuard] },

  { path: 'settings', loadChildren: loadContractorSettingsModule, canActivate: [AuthGuard] },
  { path: 'transfers', loadChildren: loadTransfersListModule, canActivate: [AuthGuard] },
  
  { path: 'issues', loadChildren: loadIssuesListModule, canActivate: [AuthGuardAdmin] },

  { path: 'not-found', loadChildren: ScrapesNotFoundModule, canActivate: [AuthGuard] },
  

];


export const ROUTES_PROVIDERS = [{
  provide: 'canActivateForLoggedIn',
  useValue: () => !! Meteor.userId(),
  AuthService,
  AuthGuard,
  AuthGuardAdmin,
  AuthGuardContractor  
}];
