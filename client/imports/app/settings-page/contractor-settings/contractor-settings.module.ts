import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { NavigationModule } from '../../navigation/navigation.module';
import { ServicesGlobalModule } from '../../services-global/services-global.module';
import { DialogStoreModule } from '../../dialog-store/dialog-store.module';
import { DialogLocationModule } from '../../dialog-location/dialog-location.module';

import { ContractorSettingsComponent } from './contractor-settings';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild([{
            path: '', component: ContractorSettingsComponent,
        }]),
        CustomMaterialModule,
        ServicesGlobalModule,
        NavigationModule,
        DialogStoreModule,
        DialogLocationModule
    ],
    declarations: [
        ContractorSettingsComponent
    ]
})
export class ContractorSettingsModule {

    constructor() {
        console.warn('----- constructor -- ContractorSettingsModule ------');
    }

}
