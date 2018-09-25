import { Meteor } from 'meteor/meteor';
import { Component, OnInit } from '@angular/core';

import { InjectUser } from "angular2-meteor-accounts-ui";
import { AuthService } from './services-global/auth/auth.service';
import { VariablesService } from './services-global/VariablesService';
import { CacheStateService } from './services-global/CacheStateService';
import { UserService } from './services-global/UserService';
import { SearchHistoryService } from './services-global/SearchHistoryService';

import template from './app.component.html';

@Component({
  selector: 'app',
  template
})
@InjectUser('user')
export class AppComponent implements OnInit {
  user: Meteor.User;
  userInfo: Object;
  score: number;

  constructor(
      public authService: AuthService,
      public _userService: UserService,
      public _varsService: VariablesService,
      private _cacheState: CacheStateService,
      public _searchHistory: SearchHistoryService) { }


  ngOnInit() {

    // if (Meteor.isCordova) {
      
      // Load locally stored search history from device
      this._searchHistory.loadAll();

      // Initialize snapshots instantly without coordinate then update after coordinates are loaded
      this._cacheState.intializeSnapshots();

      if (Meteor.userId()) {
        // call on app reload
        this._userService.initializeUserInfo(false);
      }

      this._varsService.initializeGlobalVariables();

      // Initialize login checks - call async function, then use Reactive login to update login status
      this.authService.checkLogin();

      let reactiveRankings = this._userService.getReactiveRanking();
      reactiveRankings.subscribe(x => {
        this.score = x.score;
      });

      this.userInfo = this._userService;


    // }
    // else {
    //   // similar behavior as an HTTP redirect
    //   window.location.replace("https://zojab.com/");

    //   // similar behavior as clicking on a link
    //   window.location.href = "https://zojab.com/";
    // }

    
  }

  
}
