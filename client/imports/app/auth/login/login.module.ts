import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationModule } from '../../navigation/navigation.module';
import { ServicesGlobalModule } from '../../services-global/services-global.module';

import { LoginComponent } from './login.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CustomMaterialModule,
        RouterModule.forChild([{
            path: '', component: LoginComponent,
        }]),
        NavigationModule,
        ServicesGlobalModule
    ],
    declarations: [ LoginComponent ]
})
export class LoginModule { }