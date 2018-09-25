import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { VariablesService } from '../../services-global/VariablesService';

import template from "./items-confirmed.html";

@Component({
    selector: 'items-confirmed',
    template,
})
export class ItemsConfirmedComponent implements OnInit{

    itemId: string;

    constructor(
        private _ngZone: NgZone,
        private route: ActivatedRoute,
        private router: Router,
        public _varsService: VariablesService) { }

    ngOnInit() {
        this._varsService.setReactiveHideToolbar(false);
        this._varsService.setReactiveTitleName('HELP');

        this.route.params.subscribe((params) => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.itemId = params['itemId'];
            });
        });
    }


    redirectHome() {
        this.router.navigate(['/landing']);
    }


    requestPrice() {
        if (this.itemId) {
            this.router.navigate(['/requestprices-p', { itemId: this.itemId, redirect: '/landing' }]);
        }
        else {
            this.router.navigate(['/landing']);
        }
    }

    submitPrice() {
        if (this.itemId) {
            // this.router.navigate(['/submitprices-p', { itemId: this.itemId, redirect: '/landing' }]);
        }
        else {
            this.router.navigate(['/landing']);
        }
    }

}

