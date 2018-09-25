import { PriceQueues } from '../../../both/collections/pricequeues.collection';
import { PriceQueue } from '../../../both/models/pricequeue.model';

export function loadPriceQueues() {

    if (PriceQueues.find().cursor.count() === 0) {

        var currentDate = new Date().getTime();

        let pricequue = <PriceQueue>{};
        pricequue.priceId = 'cron_test_1';
        pricequue.timestamp = currentDate;
        PriceQueues.insert(pricequue);

        let pricequue = <PriceQueue>{};
        pricequue.priceId = 'cron_test_2';
        pricequue.timestamp = currentDate;
        PriceQueues.insert(pricequue);


    }
}


