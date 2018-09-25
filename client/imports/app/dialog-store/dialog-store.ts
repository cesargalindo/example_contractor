import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';

import { SearchHistoryService } from '../services-global/SearchHistoryService';
import { Snapshots } from '../../../../both/collections/snapshots.local.collection';

import { DialogStoreDialogComponent } from './dialog-store-dialog';
import template from './dialog-store.html';

@Component({
  selector: 'dialog-store',
  template
})
export class DialogStoreComponent implements OnInit {
  submit_ss: string = 'SUBMIT-SEARCH-SETTINGS';

  storeName: string = 'click here to enter store name';
  address2: string = '';

  constructor(
      public _searchHistory: SearchHistoryService,
      public dialog: MatDialog)
  { }

  ngOnInit() {
    let searchInfo = this._searchHistory.getHistory('searchQuery_store');
    if (searchInfo.name) {
      this.storeName = searchInfo.name + ', ' + searchInfo.address1;
      this.address2 = searchInfo.address2;
    }

    MeteorObservable.autorun().subscribe(() => {
      // tt since I wrapped this Snapshot "Meteor" collection around an autorun() => {  .... });
      // tt Snapshots collection is reactive - every time it's updated while on landing page, this code will run
      Snapshots.findOne(this.submit_ss);
      let searchInfo = this._searchHistory.getHistory('searchQuery_store');
      if (searchInfo.name) {
        this.storeName = searchInfo.name + ', ' + searchInfo.address1;
        this.address2 = searchInfo.address2;
      }
    });


  }


  openDialog() {
    let adjustHeight = Math.round(window.innerHeight * 0.9);
    let adjustWidth = Math.round(window.innerWidth * 0.9);

    this.dialog.open(DialogStoreDialogComponent, {
      height: adjustHeight  + 'px',
      width:  adjustWidth + 'px'
    });


  }
}

