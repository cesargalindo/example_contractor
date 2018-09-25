import { Component } from '@angular/core';
import { LocationTrackingService } from '../services-global/LocationTrackingService';
import { SearchHistoryService } from '../services-global/SearchHistoryService';

import { Snapshots } from '../../../../both/collections/snapshots.local.collection';

import template from './dialog-loc-history-dialog.html';

@Component({
    selector: 'dialog-loc-history-dialog',
    template,
})
export class DialogLocHistoryDialog {

    request_ss: string = 'REQUEST-SEARCH-SETTINGS';
    private locationHistory: any;

    constructor(
        public _searchHistory: SearchHistoryService,
        public _locationTrackingService: LocationTrackingService) {

        this.locationHistory = this._locationTrackingService.getSearchHistory().filter(x => x.lastUserQuery.searchQuery !== undefined && x.lastUserQuery.searchQuery.length > 0);

    }


    selectHistory(item) {
        console.log(item);
        console.log(item.customPosition);

        this._locationTrackingService.setCustomPosition(item.customPosition, true, {});

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


}
