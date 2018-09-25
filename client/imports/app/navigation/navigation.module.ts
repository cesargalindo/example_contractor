import { NgModule, ModuleWithProviders } from '@angular/core';
import { CustomMaterialModule } from "../custom-material/custom-material.module";
import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';

import { SideMenusComponent } from './side-menus/side-menus';
import { TopToolbarComponent } from './top-toolbar/top-toolbar';
import { ServicesGlobalModule } from '../services-global/services-global.module';

@NgModule({
    imports: [
        CommonModule,
        CustomMaterialModule,
        RouterModule,
        ServicesGlobalModule,
        // DialogLocationModule
    ],
    declarations: [ SideMenusComponent, TopToolbarComponent ],
    exports: [ SideMenusComponent, TopToolbarComponent ]
})
export class NavigationModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: NavigationModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- NavigationModule ------');
    }
}