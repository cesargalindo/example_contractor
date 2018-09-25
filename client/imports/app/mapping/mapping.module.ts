import { NgModule, ModuleWithProviders } from '@angular/core';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { PlacesAutocompleteComponent } from './place-autocomplete/places_autocomplete';

import { AgmCoreModule } from '@agm/core';

import { ServicesGlobalModule } from '../services-global/services-global.module';
import { DialogLocHistoryModule } from '../dialog-loc-history/dialog-loc-history.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CustomMaterialModule,
        AgmCoreModule,
        DialogLocHistoryModule,
        ServicesGlobalModule
    ],
    declarations: [ PlacesAutocompleteComponent ],
    exports: [ PlacesAutocompleteComponent ]
})
export class MappingModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: MappingModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- MappingModule ------');
    }
}