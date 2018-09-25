import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router }  from '@angular/router';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';

import { CacheStateService } from '../../services-global/CacheStateService';
import { VariablesService } from '../../services-global/VariablesService';
import { SnackbarService } from '../../services/SnackbarService';

import gql from 'graphql-tag';

import template from "./items-submitted.html";

@Component({
    selector: 'items-submitted',
    template,
})
export class ItemsSubmittedComponent implements OnInit {
    apolloItems1: ApolloQueryObservable<any>;
    apolloItemsCount1: ApolloQueryObservable<any>;

    total: number = 0;
    forceFetch: boolean;

    pageSize: number = 8;
    p: number = 1;
    dateOrder: number = -1;

    status: number = 2;

    currentDate: number;

    display_spinner: boolean = true;

    constructor(
        public _snackbar: SnackbarService,
        public _varsService: VariablesService,
        private apollo: Angular2Apollo,
        private router: Router,
        private _cacheState: CacheStateService,
        private _ngZone: NgZone) { }

    // tt NOTE - auth-guard.ts will redirect to home page to load services if page is newly refreshed before getting here
    ngOnInit() {
        // Check if user has access
        this._snackbar.verifyUserAccess(true);

        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this._snackbar.displaySnackbar(1);

                }
            });
        });

        // Check if time to refetch from Apollo
        this.forceFetch = this._cacheState.apolloRefetchCacheGet('rq-active');

        // Load Requestprices Count -- it should always return before Requestprices data
        let owner = Meteor.userId();
        this.apolloItemsCount1 = this.apollo.watchQuery({
            query: gql`
                query ItemsCount1($owner: String, $status: Int) {
                  apItemsByOwnerCount(owner: $owner, status: $status) {
                    count
                  }
                }
              `,
            variables: {
                owner: owner,
                status: this.status
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.warn('######## THE COUNT ####### ' +  x.data.apItemsByOwnerCount.count);
                this.total = x.data.apItemsByOwnerCount.count;
            });

        // load initial page
        this.getItems(this.p);
    }



    getItems(page) {
        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        let serializeOptions = JSON.stringify(options);
        let owner = Meteor.userId();

        this._ngZone.run(() => { // run inside Angular2 world
            this.apolloItems1 = this.apollo.watchQuery({
                query: gql`
                    query MyItems1($owner: String, $status: Int, $options: String) {
                        apItemsByOwner(owner: $owner, status: $status, options: $options) {
                             _id
                            name
                            size
                            unit
                            quantity
                            image
                            public
                            note
                            owner
                            status
                            created
                        }
                    }
                `,
                variables: {
                    owner: owner,
                    status: this.status,
                    options: serializeOptions
                },
                fetchPolicy: 'network-only'
            })
                .map( ({ data }) => {
                    this.display_spinner = false;
                    console.warn('######## THE DATA ####### ' +  data.apItemsByOwner.length);

                    // Set catch to skip refetch
                    if (this.forceFetch) {
                        this._cacheState.apolloRefetchCacheSet('rq-active');
                    }

                    return data.apItemsByOwner;
                });
        });


    }


    editItem(it) {
        this.router.navigate(['/new-item', { itemId: it._id }]);
    }

}
