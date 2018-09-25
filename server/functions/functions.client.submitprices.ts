import { Meteor } from 'meteor/meteor';
import { Observable } from 'rxjs/Observable';

import { SubmitPrices } from '../../both/collections/submitprices.collection';
import { SubmitPrice } from '../../both/models/submitprice.model';

import { Prices } from '../../both/collections/prices.collection';
import { Price } from '../../both/models/price.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { ledgersUpdate } from './functions.client.deposits';
import { pricesElasticesearchInsert, pricesUpdate, pricesInsert } from '../functions/functions.client.prices';
import { pricequeuesInsert, pricequeuesCheck, pricequeuesRemove } from './functions.client.pricequeues';
import { requestpricesUpdates } from './functions.client.requestprices';
import { raceConditionCheck } from './functions.client.misc';

let Future = Npm.require( 'fibers/future' );


/**
 * A price doesn't exist system, thus there's no need to check for Race conditions
 *
 * @param p 
 * @param sp 
 * @param storeId 
 * @param owner 
 */
export function submitpricesInsertNewprice(p: Price, sp: SubmitPrice, storeId: string, owner: string) {
    p.storeId = storeId;

    let subPrice = pricesInsert(p);                   
    console.log(subPrice);

    sp.note = 'skipQueue_insertES';     // TODO - should I even pass this???
    sp.priceId = subPrice.id;
    sp.storeId = storeId;
    sp.status = 2;                      // since price doesn't exit, set status = 2
    sp.owner = owner;

    return submitpricesInsertSkipQueue(sp);      
}

/**
 * 
 * @param sp 
 * @param storeId 
 * @param owner 
 */
export function submitpricesInsertUpdateprice(sp: SubmitPrice, storeId: string, owner: string) {
    sp.storeId = storeId;
    sp.owner = owner;

    if (sp.note == 'skipQueue_insertES') {
        sp.status = 2;                      // since price doesn't exit, set status = 2
        return submitpricesInsertSkipQueue(sp);                         
    }
    else {
        return startQueueSubmitProcess(sp);                  
    }
}


/**
 * paidAt and payout is intentionally excluded - it will be inserted later - assuming there is a payout
 * 
 * @param sp 
 */
export function submitpricesInsert(sp: SubmitPrice) {

    // Create our future instance.
    let future = new Future();

    let currentDate = new Date().getTime();
    let tmp =  sp.note + ' = ' + sp.soldOut;

    SubmitPrices.insert({
        // _id: 'HBcdFDmawcHxYEtPa',  // force error - duplicate key
        priceId: sp.priceId,
        owner: sp.owner,
        price: sp.price,
        submittedAt: currentDate,
        updated: currentDate,
        status: sp.status,
        note: tmp
    }).subscribe(
        x => {
            // SP_LegBal_1 - ignore status = -1 && submit-new
            let xprice = <Issue>{};
            xprice.severity = 'SP_LegBal_1 ' + sp.status + ' == ';
            xprice.spId = x;
            xprice.priceId = sp.priceId;
            xprice.created = currentDate;
            xprice.note = 'SubmitPrices.insert - ' + tmp + ' owner: ' + sp.owner;
            xprice.status = sp.status;
            xprice.requestPayout = sp.payout;
            xprice.expiresAt = currentDate;
            xprice.pqId = Meteor.userId() + '--' + sp.owner;
            Issues.insert(xprice);

            future.return({
                id: x,
                status: true
            });
        },
        err => {
            console.log(err);
            future.return({
                status: false,
                error: 'submitprices.insert: unable to insert price'
            });
        }
    );


    return future.wait();
}

/**
 * 
 * @param sp 
 */
export function submitpricesInsertSkipQueue(sp: SubmitPrice) {

    // Create our future instance.
    let future = new Future();

    let peiObserv = new Observable.create(observer => {

        // Insert Price entity into elasticSearch
        // NOTE: actual price is not saved in ElasticSearch, only Quantity, Item and Store info
        if (sp.note == 'skipQueue_insertES') {
            let pes = <Price>{};
            pes._id = sp.priceId;
            pes.storeId = sp.storeId;
            pes.itemId = sp.itemId;
            pes.note = sp.note;
            pes.updated = new Date().getTime();

            let resES = pricesElasticesearchInsert(pes);
            if (resES.status) {
                observer.next(resES);
                observer.complete();
            }
            else {
                console.error('ERROR: ############# elasticesearch - ERROR 3356 ############');
                console.error(resES);
                observer.next(resES);
                observer.complete();
            }
        }
        else {
            observer.next({status: true});
            observer.complete();
        }
    });


    let spObserv = new Observable.create(observer => {
        let result = submitpricesInsert(sp);
        observer.next(result);
        observer.complete();
    });


    // Return data after both observables have fired
    let combined$ = Observable.combineLatest(peiObserv, spObserv);
    combined$.subscribe(x => {
        let results = { status: true };
        if (x[0].status) {
            // status could be true or false
            results = x[1];
        }
        else {
            // status is false
            results = x[0];
        }

        future.return(results);
    });


    return future.wait();
}


/**
 * Start Queue Process for users or cron submit price
 *  - if PriceId is not in queue, lock queue and process immediately
 *  - if a PriceId already exist, enter into queue and process when ready "top of queue"
 *
 *    - Process -
 *    a) check if PriceId exist in Queue, if not insert into Queue
 *
 *  This method is called by DDP "Admin App", cron, and Client App
 *  for DDP calls, Meteor>userId() = null
 *
 *  Note, throw new Meteor.Error occasionally kills the server it nothing is there to capture it?? - avoid using in server code
 * 
 * @param sp1 
 */
export function startQueueSubmitProcess(sp1: SubmitPrice) {

    // Create our future instance.
    let QSPfuture = new Future();

    // soldOut = TRUE means sold out
    if (sp1.soldOut) {
        // Item is sold out, set price = 99999.01
        sp1.price = 99999.01;
    }

    // 1 - Insert submit price, status should = 0, processing begins
    let results = submitpricesInsert(sp1);                                           

    if (!results.status) {
        QSPfuture.return({
            status: false,
            error: 'startQueueSubmitProcess: ' + results.error
        });
    }
    else {
        sp1._id = results.id;

        // 2 - insert PriceId into Price Queue to lock other from processing PriceId
        let pqId = pricequeuesInsert(sp1.priceId);                  

        if (pqId == 'error') {
            QSPfuture.return({
                status: false,
                error: 'Could not insert record into queue.'
            });
        }
        else {
            // 3 - check if ready in queue now before introducing delay from Meteor.setInterval
            let resultCQ = pricequeuesCheck(pqId, sp1.priceId);         

            if (resultCQ == 'ready') {
                // tt -3a check for race conditions - when Submitprices is READY to process
                let rc = raceConditionCheck(sp1._id, 'sp');
                if (rc.status) {
                    let foo = submitrpicesProcess(sp1, pqId);                                         
                    QSPfuture.return({ status: true });
                }
                else {
                    // Delete price from queue
                    pricequeuesRemove(pqId, sp1.priceId);
                    QSPfuture.return(rc);
                }
            }
            else {
                // 4 - loop for a while until priceQueue opens up for desired priceId
                let counter = 0;
                let checkPriceQueueInterval = Meteor.setInterval(function () {
                    counter++;

                    let resultCQ = pricequeuesCheck(pqId, sp1.priceId);
                    if (resultCQ == 'ready') {
                        Meteor.clearInterval(checkPriceQueueInterval);

                        // 3b - check for race conditions - when Submitprices is READY to process
                        let rc = raceConditionCheck(sp1._id, 'sp');
                        if (rc.status) {
                            submitrpicesProcess(sp1, pqId);
                            QSPfuture.return({ status: true });
                        }
                        else {
                            // Delete price from queue
                            pricequeuesRemove(pqId, sp1.priceId);
                            QSPfuture.return(rc);
                        }
                    }
                    else if (counter > 10) {
                        // 5 - Cancel if stuck in queue - waited 300 * 15 = 3.0 seconds
                        // TODO - delete inserted submit price - DON"T DELETE - hide from user - leave status at 0
                        let xprice = <Issue>{};
                        xprice.severity = 'HIGH';
                        xprice.priceId = sp1.priceId;
                        xprice.spId = sp1._id;
                        xprice.pqId = pqId;
                        xprice.created = new Date().getTime();
                        xprice.note = 'Action Required -startQueueSubmitProcess- pricequeues looped more than 10 times - waited longer than 2 seconds...';
                        xprice.status = 0;
                        Issues.insert(xprice);
                        // Delete price from queue
                        pricequeuesRemove(pqId, sp1.priceId);

                        Meteor.clearInterval(checkPriceQueueInterval);

                        QSPfuture.return({
                            status: false,
                            error: 'startQueueSubmitProcess: pricequeues looped more than 10 times - waited longer than 2 seconds...'
                        });
                    }

                }, 200);
            }
        }
    }

    return QSPfuture.wait();
}



/**
 *  res - contains all active request prices
 * 
 * @param sp1 
 * @param res 
 */
export function submitpricesUpdate_pricesUpdate(sp1: SubmitPrice, res) {
    // status -- no action is taken on passed through status -- value is implied within this method...

    let rpids = new Array();
    let newPayout = 0;
    let lastExpiresAt = 0;
    let sumPayout = 0;

    for (let i = 0, len = res.length; i < len; i++) {
        console.log(res[i]['id'] + ' <==> ' + res[i]['payout'] + ' <==> ' + res[i]['error'] );

        sumPayout += res[i]['payout'];

        // Capture rpis to log errors if payout errors
        let p1:rpid = { rpid: res[i]['id'] };
        rpids.push(p1);
    }

    let currentDate = new Date().getTime();

    // sumPayout should match payout on price
    let priceExist = Prices.findOne({_id: sp1.priceId});                         
    if (priceExist.payoutRequest != sumPayout) {
        // TODO: need to investigate why/how this happen(s)???
        let xprice = <Issue>{};
        xprice.severity = 'CRITICAL';
        xprice.spId = sp1._id;
        xprice.priceId = sp1.priceId;
        xprice.created = currentDate;
        xprice.rpids = rpids;
        xprice.requestPayout = sp1.payout;
        xprice.sumPayout = sumPayout;
        xprice.note = 'Action Required - sumPayout != sp1.payout ' + sp1.payout + ' != ' +  sumPayout;
        xprice.status = 0;
        Issues.insert(xprice);
    }

    // http://stackoverflow.com/questions/32896407/redirect-within-component-angular-2

    let pu = <Price>{};
    pu._id = sp1.priceId;
    pu.price = sp1.price;
    pu.payoutRequest = newPayout;
    pu.expiresAt = lastExpiresAt;
    pu.note = sp1.note;
    pu.updated = currentDate;
    pu.submitterId = sp1.owner;

    pricesUpdate(pu);                                    

    // status:
    // 1 just inserted/not processed - got an error if remains in this state
    // 2 - processed - pending - payment is awaiting verification
    // 3 - no-payment:  no active request prices exist, no payment was made
    // TODO - incorporate 3 - no-payment use case

    // 4 - paid: payment was processed
    // 5 - declined: payment was declined - did not pass verification

    sp1.payout = sumPayout;
    sp1.status = 2;
    sp1.rpids = rpids;
    sp1.updated = currentDate;

    submitpricesUpdate(sp1);                            

}


// ######################## Local functions #######################


/**
 *  Asynchronous call - capture error in Issues collection
 * 
 * @param sp 
 */
function submitpricesUpdate(sp: SubmitPrice) {
    // Update Submit price
    SubmitPrices.update(sp._id, {
        $set: {
            status: sp.status,
            payout: sp.payout,
            note: sp.note,
            updated: sp.updated,
            rpids: sp.rpids
        }
    }).subscribe(count => {
        let xprice = <Issue>{};
        xprice.severity = 'SP_LegBal_2 ' + sp.status + ' == ' + sp.payout;
        xprice.spId = sp._id;
        xprice.priceId = sp.priceId;
        xprice.created = sp.updated;
        xprice.note = 'SubmitPrices.insert - ' + sp.note + ' owner: ' + sp.owner;
        xprice.status = sp.status;
        xprice.requestPayout = sp.payout;
        xprice.pqId = Meteor.userId() + '--' + sp.owner;
        Issues.insert(xprice);

        if(!count) {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.spId = sp._id;
            xprice.status = sp.status;
            xprice.requestPayout = sp.payout;
            xprice.created = sp.updated;
            xprice.rpids = sp.rpids;
            xprice.note = 'ACTION REQUIRED - unable to update item ' + sp.note;
            Issues.insert(xprice);
        }
        else {
            // SP_LegBal_2 - if (Status == 2  && 'submit-new') add sp.payout to pendingSubmit balance
            // SP_LegBal_2 - if (Status == 1) --  IGNORE no payout active on this price submit
            if ( (sp.note == 'submit-new') && (sp.status == 2) ) {

                // Update Ledger balance
                ledgersUpdate(
                    'submitpricesUpdate',
                    'Unable to update item.',
                    { owner: sp.owner },
                    { pendingSubmits: sp.payout }
                );
            }

        }

    });
}

/**
 * Leave this function asynchronous
 * Have function and methods throw errors - if throw before parent function complete its caught by client
 * otherwise the server will catch - server doesn't know what to do with is so it ignores it
 *
 * @param sp1 
 * @param pqId 
 */
function submitrpicesProcess(sp1: SubmitPrice, pqId: string) {
    // note doing anything with status from sp2

    // TODO - turn this into a function call
    // Updated all Requestprices paidTos and return info
    let res = requestpricesUpdates(sp1);                

    // TODO - I should really insert submit price first -- status = 1, then update here with status = 2 (processed)
    if (res) {
        submitpricesUpdate_pricesUpdate(sp1, res);     
    }

    // Delete price from queue
    pricequeuesRemove(pqId, sp1.priceId);                           
}