import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ng2PaginationModule } from 'ng2-pagination';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { NavigationModule } from '../../navigation/navigation.module';
import { ServicesGlobalModule } from '../../services-global/services-global.module';
import { ServicesModule } from '../../services/services.module';

import { NewItemComponent } from './new-item';

@NgModule({
    imports: [
        Ng2PaginationModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild([{
            path: '', component: NewItemComponent,
        }]),
        CustomMaterialModule,
        NavigationModule,
        ServicesGlobalModule,
        ServicesModule,
    ],
    declarations: [
        NewItemComponent
    ]
})
export class NewItemModule {

    constructor() {
        console.warn('----- constructor -- NewItemModule ------');
    }

}
