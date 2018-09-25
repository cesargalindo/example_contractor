import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { LocationTrackingService } from '../services-global/LocationTrackingService';
import { SearchHistoryService } from '../services-global/SearchHistoryService';

import { Snapshots } from '../../../../both/collections/snapshots.local.collection';

import template from './dialog-store-dialog.html';

/**
 * Search for store by name located in mongoDb
 * Retreive store info - primarily storeInfo._id
 *
 */
@Component({
    selector: 'dialog-store-dialog',
    template,
})
export class DialogStoreDialogComponent implements OnInit  {

    submit_ss: string = 'SUBMIT-SEARCH-SETTINGS';

    // Geolocation variables
    lat: number;
    lng: number;

    singleStoreForm: FormGroup;
    stores: Array<any>;

    clearStoreField: string;

    paceHolderStoreName: string;
    storeName: string;
    storeAddress1: string;
    storeAddress2: string;

    message: string;
    searchEnabled: boolean = true;

    constructor(
        public _locationTrackingService: LocationTrackingService,
        public _searchHistory: SearchHistoryService,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone) {
    }

    ngOnInit() {
        this.stores = [];

        this.singleStoreForm = this.formBuilder.group({
            value: ['']
        });

        let searchInfo = this._searchHistory.getHistory('searchQuery_store');
        if (searchInfo.name) {
            this.paceHolderStoreName =  searchInfo.name + ', ' + searchInfo.address1;
            this.storeName = searchInfo.name;
            this.storeAddress1 = searchInfo.address1;
            this.storeAddress2 = searchInfo.address2;

        }
        else {
            this.paceHolderStoreName = 'click here to enter store name';
        }

        // Get latest coordinates
        this.getCoordinates();

        this.singleStoreForm.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe(searchTerm => {
                // console.error('===singleStoreForm => ' + searchTerm.value + '  defaultToCustom = ' + loc.defaultToCustom);

                // Retrieve matching stores - call mongoDB directly, avoid sub/pub
                Meteor.call('getStores', searchTerm.value, this.lat, this.lng,  (error, res) => {
                    this._ngZone.run(() => { // run inside Angular2 world
                    
                        if (error) {
                            console.log(error);
                        }
                        else {
                            this.stores = res;
                        }

                        return searchTerm;
                    
                    });
                });

            });
    }



    singleStoreSelected(storeInfo) {
        this.message = '';

        this.clearStoreField = '';
        let parts = storeInfo.address.match(/(.*?),(.*)/);

        this.storeName = storeInfo.name;
        this.storeAddress1 = parts[1];
        this.storeAddress2 = parts[2];

        // Use this as last store
        this._searchHistory.addItem("searchQuery_store", {
            storeId: storeInfo._id,
            name: storeInfo.name,
            address1: parts[1],
            address2: parts[2],
            lat: storeInfo.location.coordinates[1],
            lng: storeInfo.location.coordinates[0],
        });

        this._searchHistory.addItem("stores", {
            storeId: storeInfo._id,
            name: storeInfo.name,
            address1: parts[1],
            address2: parts[2],
            lat: storeInfo.location.coordinates[1],
            lng: storeInfo.location.coordinates[0],
        });


        Snapshots.update(this.submit_ss, {
            $set: {
                'reRunSearch': true,
            }
        });

        // this.paceHolderStoreName = storeInfo.name;
        document.getElementById('forceCloseClick').click();        
    }


    /**
     * Retrieve lat on lon from lastKnownPosition or customPosition
     *
     */
    getCoordinates() {
        let loc = this._locationTrackingService.getLocation();

        if (loc.defaultToCustom) {
            this.lat = loc.customPosition.latitude;
            this.lng = loc.customPosition.longitude;
        }
        else {
            this.lat = loc.lastKnownPosition.latitude;
            this.lng = loc.lastKnownPosition.longitude;
        }
    }

}





