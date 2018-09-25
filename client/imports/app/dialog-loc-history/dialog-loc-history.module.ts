import { NgModule, ModuleWithProviders } from '@angular/core';
import { CustomMaterialModule } from "../custom-material/custom-material.module";
import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';

import { DialogLocHistory } from './dialog-loc-history';
import { DialogLocHistoryDialog } from './dialog-loc-history-dialog';
import { ServicesGlobalModule } from '../services-global/services-global.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        CustomMaterialModule,
        ServicesGlobalModule
    ],
    declarations: [ DialogLocHistory, DialogLocHistoryDialog ],
    exports: [ DialogLocHistory, DialogLocHistoryDialog ],
    entryComponents: [
        DialogLocHistoryDialog
    ],
})
export class DialogLocHistoryModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogLocHistoryModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogLocHistoryModule ------');
    }
}