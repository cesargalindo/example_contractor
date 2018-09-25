import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

import { DialogLocHistoryDialog } from './dialog-loc-history-dialog';

import template from './dialog-loc-history.html';

@Component({
  selector: 'dialog-loc-history',
  template
})
export class DialogLocHistory implements OnInit{
  tp: boolean = false;

  constructor(
      private _router:Router,
      public dialog: MatDialog) { }


  ngOnInit() {
    if (this._router.url == '/tp') {
      this.tp = true;
    }
    console.warn(   this._router.url );
  }


  openDialog() {

    // close all other diablogs
    this.dialog.closeAll();

    this.dialog.open(DialogLocHistoryDialog, {
      height: window.innerHeight  + 'px',
      width:  window.innerWidth + 'px'
    });
  }
}

