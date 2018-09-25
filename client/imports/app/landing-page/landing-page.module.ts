import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ng2PaginationModule } from 'ng2-pagination';
import { CommonModule } from '@angular/common';

import { CustomMaterialModule } from "../custom-material/custom-material.module";
import { LandingPageComponent } from './landing-page';

import { NavigationModule } from '../navigation/navigation.module';
import { CustomPipesModule } from '../custom-pipes/custom-pipes.module';
import { ApolloXModule } from '../apollo/apollo.module';

import { ServicesGlobalModule } from '../services-global/services-global.module';
import { ServicesModule } from '../services/services.module';

@NgModule({
    imports: [
        CommonModule,
        Ng2PaginationModule,
        RouterModule.forChild([{
            path: '', component: LandingPageComponent,
        }]),
        NavigationModule,
        CustomMaterialModule,
        ApolloXModule,
        CustomPipesModule,
        ServicesGlobalModule,
        ServicesModule,
    ],
    declarations: [
        LandingPageComponent,
    ]
})
export class LandingPageModule {

    constructor() {
        console.warn('----- constructor -- LandingPageModule ------');
    }

}
