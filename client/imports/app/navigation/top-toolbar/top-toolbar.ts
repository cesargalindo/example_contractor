import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services-global/auth/auth.service';
import { VariablesService } from '../../services-global/VariablesService';

import template from './top-toolbar.html';

/**
 * Search and Select stores component
 * Results are outputted to storeList array
 *
 */
@Component({
    selector: 'top-toolbar',
    template,
    inputs: ['SIDENAV', 'showSearchIcon', 'toggleSearchbarVisibility'],

})
export class TopToolbarComponent implements OnInit {

    isLoggedIn: boolean = false;
    SIDENAV: any;

    showTopToolbar: boolean = true;
    reactiveTitle: String = 'Home';

    constructor(
        public _varsService: VariablesService,
        public authService: AuthService) {
    }

    isCurrent(pageName:string) {
        if (pageName.toLowerCase() == this.reactiveTitle.toLowerCase()) {
            return {'color': 'red'}
        }
    }

    ngOnInit() {
        this.isLoggedIn = this.authService.isLoggedIn;

        // Monitor reactiveLogin using an Observable subject
        let reactiveHideToolbar  =  this._varsService.getReactiveHideToolbar();
        reactiveHideToolbar.subscribe(x => {
            if (x) {
                this.showTopToolbar = false;
            }
            else {
                this.showTopToolbar = true
            }
        });

        // Monitor reactive Title name using an Observable subject
        let reactiveHideTitle =  this._varsService.getReactiveTitleName();
        reactiveHideTitle.subscribe(x => {
            this.reactiveTitle = x;
        });


        // Monitor reactiveLogin using an Observable subject
        let reactiveLogin  =  this.authService.getReactiveLogin();
        reactiveLogin.subscribe(x => {
          console.warn('######## reactiveLogin fired off in app.component ######## ' + x);
          if (x) {
            this.isLoggedIn = true;
          }
          else {
            this.isLoggedIn = false;
          }
        });


    }

}
