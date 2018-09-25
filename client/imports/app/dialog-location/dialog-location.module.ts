import { NgModule, ModuleWithProviders } from '@angular/core';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DialogLocationComponent } from './dialog-location';
import { DialogLocationDialogComponent } from './dialog-location-dialog';
import { ServicesGlobalModule } from '../services-global/services-global.module';
import { MappingModule } from '../mapping/mapping.module';


@NgModule({
    imports: [
        CommonModule,
        CustomMaterialModule,
        ServicesGlobalModule,
        FormsModule,
        ReactiveFormsModule,
        MappingModule,
    ],
    declarations: [ DialogLocationComponent, DialogLocationDialogComponent ],
    exports: [ DialogLocationComponent, DialogLocationDialogComponent ],
    entryComponents: [
        DialogLocationDialogComponent
    ],
})
export class DialogLocationModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogLocationModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogLocationModule ------');
    }
}