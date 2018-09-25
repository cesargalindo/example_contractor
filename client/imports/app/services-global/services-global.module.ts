import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomMaterialModule } from "../custom-material/custom-material.module";

import { CacheStateService } from './CacheStateService';
import { LocationTrackingService } from './LocationTrackingService';
import { SearchHistoryService } from './SearchHistoryService';
// import { SocketClientService } from './SocketClientService';
import { UserService } from './UserService';
import { VariablesService } from './VariablesService';


@NgModule({
    imports: [
        CommonModule,
        CustomMaterialModule
    ],
})
export class ServicesGlobalModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: ServicesGlobalModule,
            providers: [
                CacheStateService,
                LocationTrackingService,
                SearchHistoryService,
                // SocketClientService,
                UserService,
                VariablesService,
            ]
        };
    }

    constructor() {
        console.warn('----- constructor -- ServicesGlobalModule ------');
    }
}

