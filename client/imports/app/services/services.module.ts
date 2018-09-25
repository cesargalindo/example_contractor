import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { ElasticSearchService } from './ElasticSearchService';
import { SingleCollectionService } from './SingleIdCollection.data.service';
import { SnackbarService } from './SnackbarService';
import { ValidatorsService } from './ValidatorService';


@NgModule({
    imports: [
        CommonModule,
        CustomMaterialModule
    ],
    providers: [
        ElasticSearchService,
        SingleCollectionService,
        SnackbarService,
        ValidatorsService,
    ]
})
export class ServicesModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: ServicesModule,
            providers: [
                ElasticSearchService,
                SingleCollectionService,
                SnackbarService,
                ValidatorsService,
            ]
        };
    }

    constructor() {
        console.warn('----- constructor -- ServicesModule ------');
    }
}

