import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ng2PaginationModule } from 'ng2-pagination';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { ServicesGlobalModule } from '../services-global/services-global.module';
import { NavigationModule } from '../navigation/navigation.module';
import { CustomPipesModule } from '../custom-pipes/custom-pipes.module';

import { IssuesListComponent } from './issues-list';

@NgModule({
    imports: [
        Ng2PaginationModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild([{
            path: '', component: IssuesListComponent,
        }]),
        CustomMaterialModule,
        ServicesGlobalModule,
        NavigationModule,
        CustomPipesModule,
    ],
    declarations: [
        IssuesListComponent
    ]
})
export class IssuesListModule {

    constructor() {
        console.warn('----- constructor -- IssuesListModule ------');
    }

}
