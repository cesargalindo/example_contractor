import {Component} from '@angular/core';
import { MatDialog } from '@angular/material';

import template from './dialog-location.html';

import { DialogLocationDialogComponent } from './dialog-location-dialog';

@Component({
  selector: 'dialog-location',
  template
})
export class DialogLocationComponent {
  constructor(public dialog: MatDialog) { }

  openDialog() {
    this.dialog.open(DialogLocationDialogComponent, {
      height: window.innerHeight  + 'px',
      width:  window.innerWidth + 'px'
    });
  }
}

