import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ng2PaginationModule } from 'ng2-pagination';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { NavigationModule } from '../../navigation/navigation.module';
import { ServicesGlobalModule } from '../../services-global/services-global.module';
import { ServicesModule } from '../../services/services.module';
import { CustomPipesModule } from '../../custom-pipes/custom-pipes.module';

import { ItemsSubmittedComponent } from './items-submitted';

import { ApolloXModule } from '../../apollo/apollo.module'

@NgModule({
    imports: [
        Ng2PaginationModule,
        CommonModule,
        RouterModule.forChild([{
            path: '', component: ItemsSubmittedComponent,
        }]),
        CustomMaterialModule,
        NavigationModule,
        ServicesGlobalModule,
        ServicesModule,
        CustomPipesModule,
        ApolloXModule,
    ],
    declarations: [
        ItemsSubmittedComponent
    ]
})
export class ItemsSubmittedModule {

    constructor() {
        console.warn('----- constructor -- ItemsSubmittedModule ------');
    }

}
