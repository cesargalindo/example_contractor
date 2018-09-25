import { PriceQueues } from '../../both/collections/pricequeues.collection';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

let Future = Npm.require( 'fibers/future' );


/**
 * Check if PriceId,id has made it to the top of the Queue
 *
 * @param id
 * @param priceId
 * @returns {string}
 */
export function pricequeuesCheck(id, priceId) {
    let pq = PriceQueues.find(
        {priceId: priceId},
        {sort: {timestamp: 1}}
    ).fetch();

    if (pq.length) {
        console.log("******>>>>> pricequeues.check ------- " + priceId + " -- " + id);

        if (pq[0]._id == id) {
            return 'ready';
        }
        else {
            return 'wait';
        }
    }
    else {
        return 'wait';
    }
}


/**
 * Insert PriceId into PriceQueue
 *
 * @param priceId 
 */
export function pricequeuesInsert(priceId) {

    // Create our future instance.
    let future = new Future();
    let currentDate = new Date().getTime();

    PriceQueues.insert({
        priceId: priceId,
        timestamp: currentDate,
    }).subscribe(
        x => {
            console.log('true spID here = ' + x  + ' -- priceId = ' + priceId);
            future.return( x );
        },
        err => {
            console.log(err);
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.priceId = priceId;
            xprice.created = currentDate;
            xprice.note = 'Action Required - pricequeues.insert - Could not insert PriceId into PriceQueue';
            xprice.status = 0;
            Issues.insert(xprice);
            future.return( 'error');
        }
    );

    return future.wait();
}


/**
 * Remove price queue
 * 
 * @param id 
 * @param priceId 
 */
export function pricequeuesRemove(id, priceId) {

    // Delete Price from Queue ...
    PriceQueues.remove({
        _id: id,
        priceId: priceId,
    }).subscribe(count => {

        if (!count) {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.pqId = id;
            xprice.priceId = priceId;
            xprice.created = new Date().getTime();
            xprice.note = 'Action Required - pricequeues.remove - Could not remove PriceQueue = ' + id;
            xprice.status = 0;
            Issues.insert(xprice);
        }

    });
}