import { NgModule, ModuleWithProviders } from '@angular/core';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DialogStoreComponent } from './dialog-store';
import { DialogStoreDialogComponent } from './dialog-store-dialog';
import { ServicesGlobalModule } from '../services-global/services-global.module';
import { MappingModule } from '../mapping/mapping.module';


@NgModule({
    imports: [
        CommonModule,
        CustomMaterialModule,
        ServicesGlobalModule,
        FormsModule,
        ReactiveFormsModule,
        MappingModule
    ],
    declarations: [ DialogStoreComponent, DialogStoreDialogComponent ],
    exports: [ DialogStoreComponent, DialogStoreDialogComponent ],
    entryComponents: [
        DialogStoreDialogComponent
    ],
})
export class DialogStoreModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogStoreModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogStoreModule ------');
    }
}