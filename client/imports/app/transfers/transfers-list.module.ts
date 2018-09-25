import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from "../custom-material/custom-material.module";
import { ServicesGlobalModule } from '../services-global/services-global.module';
import { NavigationModule } from '../navigation/navigation.module';

import { TransfersListComponent } from './transfers-list';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([{
            path: '', component: TransfersListComponent,
        }]),
        CustomMaterialModule,
        ServicesGlobalModule,
        NavigationModule,
    ],
    declarations: [
        TransfersListComponent
    ]
})
export class TransfersListModule {

    constructor() {
        console.warn('----- constructor -- TransfersListModule ------');
    }

}
