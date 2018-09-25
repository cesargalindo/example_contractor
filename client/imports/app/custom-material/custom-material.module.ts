// https://github.com/angular/material2/issues/4137
import 'hammerjs';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatToolbarModule,
    MatInputModule,
    // MatFormFieldModule,
    MatMenuModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule,
    MatCardModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
} from '@angular/material';

@NgModule({
    imports: [
        CommonModule,
        MatToolbarModule,
        MatInputModule,
        // MatFormFieldModule,
        MatMenuModule,
        MatIconModule,
        MatSliderModule,
        MatSelectModule,
        MatTabsModule,
        MatSnackBarModule,
        MatRadioModule,
        MatCheckboxModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatDialogModule,
        MatCardModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule
    ],
    exports: [
        CommonModule,
        MatToolbarModule,
        MatInputModule,
        // MatFormFieldModule,
        MatMenuModule,
        MatIconModule,
        MatSliderModule,
        MatSelectModule,
        MatTabsModule,
        MatSnackBarModule,
        MatRadioModule,
        MatCheckboxModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatDialogModule,
        MatCardModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule
    ]
})
export class CustomMaterialModule {
    constructor() {
        console.warn('----- constructor -- CustomMaterialModule ------');
    }
}
