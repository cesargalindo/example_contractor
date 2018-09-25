import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ng2PaginationModule } from 'ng2-pagination';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { NavigationModule } from '../../navigation/navigation.module';
import { ServicesGlobalModule } from '../../services-global/services-global.module';

import { ItemsConfirmedComponent } from './items-confirmed';

@NgModule({
    imports: [
        Ng2PaginationModule,
        CommonModule,
        RouterModule.forChild([{
            path: '', component: ItemsConfirmedComponent,
        }]),
        CustomMaterialModule,
        NavigationModule,
        ServicesGlobalModule,
    ],
    declarations: [
        ItemsConfirmedComponent
    ]
})
export class ItemsConfirmedModule {

    constructor() {
        console.warn('----- constructor -- ItemsConfirmedModule ------');
    }

}
