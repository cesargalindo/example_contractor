import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DisplayCount } from './display-count.pipe';
import { DisplayDecimalUp, DisplayDecimalDown } from './display-decimal.pipe';
import { DisplayDistance } from './display-distance.pipe';
import { DisplayFormatDateNow, DisplayFormatDate, DisplayFormatTime } from './display-format-date.pipe';
import { DisplayHours } from './display-hours.pipe';
import { DisplayNamePipe } from './display-name.pipe';
import { DisplayPrice } from './display-price.pipe';
import { DisplayItemStatus, DisplayPriceStatus, DisplayRequestpriceStatus, DisplaySubmitpriceStatus, DisplaySubmitStatus, DisplayWithdrawalStatus } from './display-status.pipe';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        DisplayCount,
        DisplayDecimalUp,
        DisplayDecimalDown,
        DisplayDistance,
        DisplayFormatDateNow,
        DisplayFormatDate,
        DisplayFormatTime,
        DisplayHours,
        DisplayNamePipe,
        DisplayPrice,
        DisplayItemStatus,
        DisplayPriceStatus,
        DisplayRequestpriceStatus,
        DisplaySubmitpriceStatus,
        DisplaySubmitStatus,
        DisplayWithdrawalStatus
    ],
    exports: [
        DisplayCount,
        DisplayDecimalUp,
        DisplayDecimalDown,
        DisplayDistance,
        DisplayFormatDateNow,
        DisplayFormatDate,
        DisplayFormatTime,
        DisplayHours,
        DisplayNamePipe,
        DisplayPrice,
        DisplayItemStatus,
        DisplayPriceStatus,
        DisplayRequestpriceStatus,
        DisplaySubmitpriceStatus,
        DisplaySubmitStatus,
        DisplayWithdrawalStatus
    ]
})
export class CustomPipesModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: CustomPipesModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- CustomPipesModule ------');
    }
}