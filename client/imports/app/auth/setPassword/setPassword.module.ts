import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomMaterialModule } from "../../custom-material/custom-material.module";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationModule } from '../../navigation/navigation.module';

import { SetPasswordComponent } from './setPassword.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CustomMaterialModule,
        RouterModule.forChild([{
            path: '', component: SetPasswordComponent,
        }]),
        NavigationModule
    ],
    declarations: [ SetPasswordComponent ],
})
export class SetPasswordModule { }