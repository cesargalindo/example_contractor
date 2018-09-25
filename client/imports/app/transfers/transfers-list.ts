import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';

import { VariablesService } from '../services-global/VariablesService';

import template from "./transfers-list.html";

@Component({
    selector: 'transfers-list',
    template,
})
export class TransfersListComponent implements OnInit {

    error: string;

    transfers: Array<any>;

    constructor(
        public _varsService: VariablesService,
        private _ngZone: NgZone) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('My Work');
        this.getTransfersInfo();
    }


    getTransfersInfo() {

        Meteor.call('transfers.get', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                if (err) {
                    console.error("!!!!!!!! GOT AN ERROR ON: transfers.get..... !!!!!!!!!");
                    console.error(err);
                    this.error = err;
                }
                else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: transfers.get ..... !!!!!!!!! == " + res.error);
                        console.error(err);
                        this.error = res.error;
                    }
                    else {
                        console.warn("SUCCESSFULLY called transfers.get... " + res.status);
                        console.warn(res);
                        this.transfers = res.data;
                    }
                }

            });
        });
    }


}
