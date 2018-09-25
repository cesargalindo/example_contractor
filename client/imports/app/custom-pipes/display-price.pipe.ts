import { Pipe, PipeTransform } from '@angular/core';
import { Price } from '../../../../both/models/price.model';

@Pipe({
    name: 'displayPrice',
})
export class DisplayPrice implements PipeTransform {

    transform(price: Price): string {
        // console.log( price.price + ' -- ' + price.gsize + ' -- ' + price.gunit );
        return  '$' + Math.round( price.price * price.gsize * 100 ) / 100;
    }
}

