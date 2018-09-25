import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { SearchHistoryService } from '../services-global/SearchHistoryService';
import { LocationTrackingService } from '../services-global/LocationTrackingService';

import { Snapshots } from '../../../../both/collections/snapshots.local.collection';
import { snapshot } from '../../../../both/models/snapshot.model';
import { SearchQuery_store } from '../../../../both/models/helper.models';

import template from './dialog-location-dialog.html';

@Component({
    selector: 'dialog-location-dialog',
    template,
})
export class DialogLocationDialogComponent implements OnInit  {
    request_ss: string = 'REQUEST-SEARCH-SETTINGS';
    selectedRadio: string;

    // Geolocation variables
    lat: number;
    lng: number;

    snapshot : snapshot;

    customAddress: string = '';
    searchEnabled: boolean = true;
    public persist:boolean = true;

    dialogPadding: boolean = false;

    constructor(
        public _searchHistory: SearchHistoryService,
        private _ngZone: NgZone,
        private formBuilder: FormBuilder,
        public _locationTrackingService: LocationTrackingService) { }


    ngOnInit() {
        let searchInfoC = this._searchHistory.getHistory("searchQuery_type");

        // Always set radio to Stores near custom
        this.selectedRadio = 'Stores near' + ' ' + 'custom';

        // Get location info
        let xloc = this._locationTrackingService.getLocation();

        console.warn(xloc);

        if (xloc.defaultToCustom) {
            if (xloc.lastUserQuery.address != undefined) {
                this.customAddress = xloc.lastUserQuery.address;
            }
        }
        else {
            this.customAddress = xloc.lastUserQuery.address;
        }
    }


    customAddressSelected(x) {
        console.log('####### 888 ######' + x.results.longitude + ", " + x.results.latitude + ' -- ' +   x.results.address);
        this.customAddress = x.results.address;

        this._locationTrackingService.setCustomPosition(
            {
                latitude: x.results.latitude,
                longitude: x.results.longitude,
                accuracy: 10
            },
            true,
            {address: x.results.address}
        );


        this._searchHistory.addItem("searchQuery_type", {
            searchType: 'Stores near',
            locationType: 'custom',
        });


        Snapshots.update(this.request_ss, {
            $set: {
                'reRunSearch': true,
            }
        });

        document.getElementById('forceCloseClick').click();
    }


    /**
     * @param searchType 
     */
    searchTypeSelected(searchType) {
        this._ngZone.run(() => { // run inside Angular2 world
            this.selectedRadio = searchType;
        });

        // 2 - do not update searchSettings here - custom address is undefined
        // 2 - update when custom address is selected first
        if ( (this.customAddress == '') || (this.customAddress == undefined) ) {
            return;
        }

        // tt - Using custom location
        this._locationTrackingService.setDefaultSource('custom');

        let xloc = this._locationTrackingService.getLocation();
        this.customAddress = xloc.lastUserQuery.address;


        this._searchHistory.addItem("searchQuery_type", {
            searchType: 'Stores near',
            locationType: 'custom',
        });

        Snapshots.update(this.request_ss, {
            $set: {
                'reRunSearch': true,
            }
        });
    }


    inputClicked() {
        if (Meteor.isCordova) {
            console.warn('focusing shit...');
            if(this.dialogPadding) {
                this.dialogPadding = false;
            }
            else {
                this.dialogPadding = true;
            }
        }
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
