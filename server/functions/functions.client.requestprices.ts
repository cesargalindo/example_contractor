import { Meteor } from 'meteor/meteor';
import { RequestPrices } from '../../both/collections/requestprices.collection';
import { RequestPrice } from '../../both/models/requestprice.model';

import { Price } from '../../both/models/price.model';
import { RequestPrice } from '../../both/models/requestprice.model';
import { SubmitPrice } from '../../both/models/submitprice.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { ledgersUpdate } from './functions.client.deposits';
import { pricesElasticesearchInsert, pricesUpdate, pricesInsert } from '../functions/functions.client.prices';
import { pricequeuesInsert, pricequeuesCheck, pricequeuesRemove } from './functions.client.pricequeues';
import { checkLedgerBalance, raceConditionCheck } from './functions.client.misc';

import { RequestPriceProcess } from '../../both/models/helper.models';

import { Observable } from 'rxjs/Observable';

let Future = Npm.require( 'fibers/future' );


/**
 * A Price exist in system, must check for race conditions
 *
 * @param rp 
 * @param storeId 
 * @param owner 
 * @param callFrom 
 */
export function requestpricesInsertUpdateprice(rp: RequestPrice, storeId: string, owner: string, callFrom: string) {
    // Ensure user has sufficient funds
    let bc = checkLedgerBalance(rp, callFrom);
    if (!bc.status) {
        return bc;
    }

    if (rp.note == 'skipQueue_insertES') {
        return {
            status: false,
            error: "App reached unknown state 233. Contact ZoJab support."
        }
    }
    else {
        let rpObject = new RequestPriceProcess();
        rpObject.priceId = rp.priceId;
        rpObject.storeId = storeId;
        rpObject.itemId = rp.itemId;
        rpObject.userId = owner;
        rpObject.payRequest = rp.payRequest;
        rpObject.updated = rp.updated;
        rpObject.expiresAt = rp.expiresAt;
        rpObject.status = rp.status;
        rpObject.note = rp.note;
        return startQueueRequestProcess(rpObject);                   //ee async calls (parent method is sync)
    }
}



/**
 * A price doesn't exist system, thus there's no need to check for Race conditions
 *
 * @param p 
 * @param rp 
 * @param storeId 
 * @param owner 
 * @param callFrom 
 */
export function requestpricesInsertNewprice(p: Price, rp: RequestPrice, storeId: string, owner: string, callFrom: string) {
    // Ensure user has sufficient funds
    let bc = checkLedgerBalance(rp, callFrom);
    if (!bc.status) {
        return bc;
    }

    p.storeId = storeId;
    p.soldOut = false;

    // Since we are inserting a new price - price value is null
    p.price = 99999.06;
    p.note = 'insert-new-rp';

    let priceRes = pricesInsert(p);                                     

    // Insert Requestprice
    rp.priceId = priceRes.id;
    rp.storeId = storeId;
    rp.status = 1;                      // 1 = ready
    rp.note = 'skipQueue_insertES';
    rp.owner =  owner;

    // storeId and itemId are required when inserting new Price
    if (rp.note == 'skipQueue_insertES') {
        return requestpricesInsertSkipQueue(rp);                    
    }
    else {
        return {
            status: false,
            error: "App reached unknown state 235. Contact ZoJab support."
        }
    }

}


/**
 * Called by various client components
 * RequestedAt is updated whenever a user select to edit an existing priceRequest - regardless whether user changed value or not
 * 
 * @param rp 
 */
export function requestPricesUpdate(rp: RequestPrice) {
    let payRequestOrig = rp.payRequestOrig;

    if (!rp.payRequestOrig) {
        let requestPrices = RequestPrices.findOne({_id: rp._id});
        payRequestOrig = requestPrices.payRequest;
    }

    /**
     * Used by client to cancel (status = 4)
     * only Admin can approve using DDP (status = 1)
     */
    if (rp.status) {
        RequestPrices.update(rp._id, {
            $set: {
                updated: rp.updated,
                status: rp.status,
                note: rp.note,
            }
        }).subscribe(count => {
            let xprice = <Issue>{};
            xprice.severity = 'LegBal_3 ' + rp.status + ' == ' + payRequestOrig;
            xprice.rpId = rp._id;
            xprice.priceId = rp.priceId;
            xprice.created = rp.updated;
            xprice.note = 'RequestPrices.update - ' + rp.note + ' owner: ' + rp.owner;
            xprice.status = rp.status;
            xprice.requestPayout = rp.payRequest;
            xprice.expiresAt = rp.expiresAt;
            xprice.pqId = Meteor.userId();
            Issues.insert(xprice);

            if(!count) {
                let xprice = <Issue>{};
                xprice.severity = 'CRITICAL';
                xprice.rpId = rp._id;
                xprice.priceId = rp.priceId;
                xprice.created = rp.updated;
                xprice.note = 'ACTION REQUIRED 104 - could not update Requestprices - ' + rp.note;
                xprice.status = rp.status;
                xprice.requestPayout = payRequestOrig;
                xprice.expiresAt = rp.expiresAt;
                Issues.insert(xprice);
            }
            else {
                // LegBal_3 - if ('cancel-new' && status == 4) -- add payRequestOrig to requests-balance, 
                                                               // subtract payRequestOrig from pendingRequests
                if ( (rp.status == 4) && (rp.note == 'cancel-new') ) {
                    let sum = -1 * payRequestOrig;
                    // Update Ledger balance 
                    ledgersUpdate(
                        'requestPricesUpdate 1',
                        'Unable to update update Requestprices',
                        { owner: Meteor.userId() },
                        { requests: payRequestOrig, pendingRequests: sum }
                    );
                }
            }

        });
    }
    else {
        // Update Request price
        RequestPrices.update(rp._id, {
            $set: {
                payRequest: rp.payRequest,
                expiresAt: rp.expiresAt,
                updated: rp.updated,
                requestedAt: rp.requestedAt,
                note: rp.note
            }
        }).subscribe(count => {
            let xprice = <Issue>{};
            xprice.severity = 'LegBal_4 - ' + rp.status + ' == ' + payRequestOrig;
            xprice.rpId = rp._id;
            xprice.priceId = rp.priceId;
            xprice.created = rp.updated;
            xprice.note = 'RequestPrices.update - ' + rp.note + ' owner: ' + rp.owner;
            xprice.status = rp.status;
            xprice.requestPayout = rp.payRequest;
            xprice.expiresAt = rp.expiresAt;
            xprice.pqId = Meteor.userId();
            Issues.insert(xprice);

            if(!count) {
                let xprice = <Issue>{};
                xprice.severity = 'CRITICAL';
                xprice.rpId = rp._id;
                xprice.priceId = rp.priceId;
                xprice.created = rp.updated;
                xprice.note = 'ACTION REQUIRED 105 - could not update Requestprices - ' + rp.note;
                xprice.status = rp.status;
                xprice.requestPayout = rp.payRequest;
                xprice.expiresAt = rp.expiresAt;
                Issues.insert(xprice);
            }
            else {
                // LegBal_4 - if ('update-active') -- update balance =  (payRequestOrig - rp.payRequest) + balance
                // LegBal_4 - if ('update-new') -- update balance =  (payRequestOrig - rp.payRequest) + balance
                let sum = payRequestOrig - rp.payRequest;
                let sum2 = rp.payRequest - payRequestOrig;
                if (rp.owner == undefined) {
                    rp.owner = Meteor.userId();
                }

                if ( (rp.note == 'update-active') || (rp.note == 'update-new') ) {
                    // Update Ledger balance
                    ledgersUpdate(
                        'requestPricesUpdate 2',
                        'Unable to update update Requestprices',
                        { owner: rp.owner },
                        { requests: sum, pendingRequests: sum2 }
                    );
                }
            }
        });
    }

    return {status: true};
}

/**
 * 
 * @param rp 
 */
export function requestpricesInsert(rp: RequestPrice) {

    // Create our future instance.
    let future = new Future();

    if (rp.status == '') {
        rp.status = -1;
    }

    // Insert new Price Request
    RequestPrices.insert({
        //_id: 'msZtwwqP6KzE8ZTPf',  // use this to force an error
        priceId: rp.priceId,
        owner: rp.owner,
        payRequest: rp.payRequest,
        priceFactor: 0,
        requestedAt: rp.updated,
        expiresAt: rp.expiresAt,
        updated: rp.updated,
        status: rp.status,           // set status = 0  need to update price entity, status = 9, pending admin approval
        note: rp.note,
    })
        .subscribe(
            x => {
                let xprice = <Issue>{};
                xprice.severity = 'LegBal_1 - ' + rp.status;
                xprice.rpId = rp._id;
                xprice.priceId = rp.priceId;
                xprice.created = rp.updated;
                xprice.note = 'requestprices.insert - ' + rp.note;
                xprice.status = rp.status;
                xprice.requestPayout = rp.payRequest;
                xprice.expiresAt = rp.expiresAt;
                xprice.pqId = Meteor.userId() + ' - ' + rp.owner;
                Issues.insert(xprice);

                //tt 1) When Requestprice is inserted with a queue, it's status = 0 - do not update Ledger here
                //tt 2) Update balance when Requestprice is inserted with status equal to to 1 or 9
                // LegBal_1 - if (status = 1)  -- Subtract rp.payRequest from request-balance, 
                                            // add to pendingRequests
                // LegBal_1 - if (status = 9) -- Subtract rp.payRequest from request-balance, 
                                            // add to pendingRequests
                if ( (rp.status == 1) || (rp.status == 9) )  {
                    let sum = -1 * rp.payRequest;

                    // Update Ledger balance 
                    ledgersUpdate(
                        'requestpricesInsert',
                        'Unable to insert Requestprices',
                        { owner: rp.owner },
                        { requests: sum, pendingRequests: rp.payRequest }
                    );
                }

                future.return({
                    status: true,
                    rpId: x,
                    expiresAt: rp.expiresAt,
                    currentDate: rp.updated,
                });
            },
            err => {
                console.log(err);
                future.return({
                    status: false,
                    error: 'requestprices.insert: unable to insert price'
                });
            }
        );

    return future.wait();
}


/**
 * Since method is called by cron, ddp, client, etc - catch errors using node.js domain
 *
 */
export function requestpricesUpdateStatus(reqId, status, note, payRequestOrig, owner, paidTosAmount) {
    let currentDate = new Date().getTime();

    RequestPrices.update(reqId, {
        $set: {
            status: status,
            updated: currentDate,
            note: note,
        }
    }).subscribe(count => {
        let xprice = <Issue>{};
        xprice.severity = 'LegBal_5 - ' + status + ' == ' + payRequestOrig;
        xprice.rpId = reqId;
        xprice.priceId = 'xx';
        xprice.created = currentDate;
        xprice.note = 'requestpricesUpdateStatus - ' + note;
        xprice.status = status;
        xprice.requestPayout = 0;
        xprice.expiresAt = 0;
        xprice.pqId = Meteor.userId();
        Issues.insert(xprice);

        if(!count) {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.created =  currentDate;
            xprice.rpId = reqId;
            xprice.note = 'ACTION REQUIRED requestpricesUpdateStatus - could not update requestprices - ' + note;
            xprice.status = status;
            Issues.insert(xprice);
        }
        else {
            // LegBal_5 - if  ( 'request-new' & status  == 1 ) -- subtract payRequestOrig from request-balance, 
                                                            // add payRequestOrig to pendingRequests
            if ( (note == 'request-new') && (status == 1) ) {
                let sum = -1 * payRequestOrig;

                // Update Ledger balance
                ledgersUpdate(
                    'requestpricesUpdateStatus 1',
                    'Unable to update RequestPrices',
                    { owner: owner },
                    { requests: sum, pendingRequests: payRequestOrig }
                );
            }
            // LegBal_5 - if ( 'cancel-active' & status == 4 ) -- add (payRequestOrig-paidTosAmount) from request-balance, 
                                                            // subtract (payRequestOrig-paidTosAmount) from pendingRequests
            else if ( (note == 'cancel-active') && (status == 4) ) {
                let bal1 = payRequestOrig - paidTosAmount;
                let bal2 = -1 * bal1;

                // Update Ledger balance
                ledgersUpdate(
                    'requestpricesUpdateStatus 2',
                    'Unable to update RequestPrices',
                    { owner: owner },
                    { requests: bal1, pendingRequests: bal2 }
                );
            }

        }

    });
}


export function requestpricesInsertSkipQueue(rp: RequestPrice) {

    // Create our future instance.
    let future = new Future();

    let peiObserv = new Observable.create(observer => {

        // Insert Price entity into elasticSearch
        // NOTE: actual price is not saved in ElasticSearch, only Quantity, Item and Store info
        if (rp.note == 'skipQueue_insertES') {
            let pes = <Price>{};
            pes._id = rp.priceId;
            pes.storeId = rp.storeId;
            pes.itemId = rp.itemId;
            pes.note = rp.note;
            pes.updated = rp.updated;

            let resES = pricesElasticesearchInsert(pes);
            if (resES.status) {
                observer.next(resES);
                observer.complete();
            }
            else {
                observer.next(resES);
                observer.complete();
            }

        }
        else {
            observer.next({status: true});
            observer.complete();
        }

    });


    let rpObserv = new Observable.create(observer => {
        let resReq = requestpricesInsert(rp);
        if (resReq.status) {
            observer.next(resReq);
            observer.complete();
        }
        else {
            console.error('############# requestprices.insert - error 113 ############');
            console.error(resReq);
            observer.next(resReq);
            observer.complete();
        }

    });


    // Return data after both observables have fired
    let combined$ = Observable.combineLatest(peiObserv, rpObserv);
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
 *
 * query for all active requestPrice with priceIds - return minimum expiresAt
 * sum all payouts in paidTos - subtract remaining payout from original requestPrice payout
 * update price collection = priceId
 * cancel requestPrice by setting status = 2
 *
 * @param rp1 
 */
export function requestpricesQueueCancel(rp1: RequestPriceProcess) {
    rp1.expiresAt = 0;      // override later - otherwise keep the same...
    rp1.payRequest = 0;     // contains the amount paid out to users

    // 1 - fetch requestprices from db to get original payoutRequest
    let requestPrices = RequestPrices.find({
        _id: rp1.id
    }).fetch();

    requestPrices.map(x => {
        // 2 - assign priceId from requestPrices collection to avoid hacks in url "link" - rpId is provided in URL
        rp1.priceId = x.priceId;
        rp1.payRequestOrig = x.payRequest;

        if (x.paidTos != undefined) {
            x.paidTos
                .map(y => {
                    console.log(y);
                    rp1.payRequest =  rp1.payRequest + y.payout;
                });
        }
    });

    // 3 - If DPP call is made, allow if Admin Key is legit, otherwise confirm owner of this Requestprice
    
    // Create our future instance.
    let QRPCfuture = new Future();

    // 4 - insert PriceId into Price Queue to lock others from processing PriceId - synchronous call
    let pqId = pricequeuesInsert(rp1.priceId);                          
    if (pqId == 'error') {
        QRPCfuture.return({
            status: false,
            error: 'Could not insert record into queue.'
        });
    }
    else {
        // 5 - check if ready in queue now before introducing delay from Meteor.setInterval
        let resultCQ = pricequeuesCheck(pqId, rp1.priceId);
        if (resultCQ == 'ready') {
            rp1.pqId = pqId;

            // 5a - check for race conditions - when Requestprice is READY to process
            let rc = raceConditionCheck(rp1.id, 'rp');
            if (rc.status) {
                // 6 - Determine earliest expireAt - retrieve after locking queue
                let reqPriceInfo = RequestPrices.find(
                    {
                        priceId: rp1.priceId,
                        status: 1,
                        _id: {$ne: rp1.id}
                    },
                    {
                        sort: {expiresAt: 1},
                        limit: 1
                    }).fetch();

                reqPriceInfo.map(y => {
                    rp1.expiresAt = y.expiresAt;
                });
                let results = requestpicesProcess(rp1);                                                 //ee ASYNC call - partial sync
                QRPCfuture.return(results);
            }
            else {
                // Delete price from queue
                pricequeuesRemove(pqId, rp1.priceId);
                QRPCfuture.return(rc);
            }
        }
        else {
            //tt-7 loop for a while until priceQueue opens up for desired priceId
            let counter = 0;
            let checkPriceQueueInterval = Meteor.setInterval(function () {
                counter++;
                let resultCQ = pricequeuesCheck(pqId, rp1.priceId);

                // 8 - Determine earliest expireAt - retrieve after locking queue
                let reqPriceInfo = RequestPrices.find(
                    {
                        priceId: rp1.priceId,
                        status: 1,
                        _id: { $ne: rp1.id}
                    },
                    {
                        sort: {expiresAt: 1},
                        limit: 1
                    }).fetch();

                reqPriceInfo.map(y => {
                    rp1.expiresAt  = y.expiresAt;
                });
                if (resultCQ == 'ready') {
                    Meteor.clearInterval(checkPriceQueueInterval);

                    // 8b - check for race conditions - when Requestprice is READY to process
                    let rc = raceConditionCheck(rp1.id, 'rp');
                    if (rc.status) {
                        rp1.pqId = pqId;
                        let results = requestpicesProcess(rp1);                                         //ee ASYNC call - partial sync
                        QRPCfuture.return(results);
                    }
                    else {
                        // Delete price from queue
                        pricequeuesRemove(pqId, rp1.priceId);
                        QRPCfuture.return(rc);
                    }
                }

                // Cancel if stuck in queue
                else if (counter > 10) {
                    Meteor.clearInterval(checkPriceQueueInterval);
                    let xprice = <Issue>{};
                    xprice.severity = 'HIGH';
                    xprice.priceId = rp1.priceId;
                    xprice.rpId = rp1.id;
                    xprice.pqId = pqId;
                    xprice.created = new Date().getTime();
                    xprice.note = 'Action Required -requestpricesQueue.cancel- pricequeues looped more than 10 times - waited longer than 2 seconds...';
                    xprice.status = 0;
                    Issues.insert(xprice);

                    // Delete price from queue
                    pricequeuesRemove(pqId, rp1.priceId);
                    QRPCfuture.return({
                        status: false,
                        error: 'requestpricesQueue.cancel: pricequeues looped more than 10 times - waited longer than 2.4 seconds...'
                    });
                }

            }, 200);
        }
    }

    return QRPCfuture.wait();
}



/**
 *
 */
export function requestpricesQueueUpdate(rp1: RequestPriceProcess) {

    let requestPrices = RequestPrices.findOne({_id: rp1.id});

    // Create our future instance.
    let QRPUfuture = new Future();

    //tt-0 Ensure user is not allowed to edit a Requestprices with PaidTos
    if (requestPrices.paidTos != undefined) {
        QRPUfuture.return({
            status: false,
            error: 'requestpricesQueueUpdate: A user has already submitted price. Your are not allowed to edit this request.'
        });
    }
    else {
        rp1.priceId = requestPrices.priceId;
        rp1.payRequestOrig = requestPrices.payRequest;
        rp1.requestedAt = rp1.updated;

        // 1 - insert PriceId into Price Queue to lock other from processing PriceId - synchronous call
        let pqId = pricequeuesInsert(requestPrices.priceId);                                     

        if (pqId == 'error') {
            QRPUfuture.return({
                status: false,
                error: 'Could not insert record into queue.'
            });
        }
        else {
            // 2 - check if ready in queue now before introducing delay from Meteor.setInterval
            let resultCQ = pricequeuesCheck(pqId, requestPrices.priceId);
            if (resultCQ == 'ready') {

                // 2a - check for race conditions - when Requestprice is READY to process
                let rc = raceConditionCheck(rp1.id, 'rp');
                if (rc.status) {
                    rp1.pqId = pqId;
                    let results = requestpicesProcess(rp1);                                                             //ee async all - partially sync
                    QRPUfuture.return(results);

                }
                else {
                    // Delete price from queue
                    pricequeuesRemove(pqId, rp1.priceId);
                    QRPUfuture.return(rc);
                }
            }
            else {
                // 3 - loop for a while until priceQueue opens up for desired priceId
                let counter = 0;
                let checkPriceQueueInterval = Meteor.setInterval(function () {
                    counter++;
                    console.log(" pricequeuesCheck method called " + counter + " times... id=" + pqId + '  payoutRequest: ' + rp1.payRequest);
                    let resultCQ = pricequeuesCheck(pqId, requestPrices.priceId);

                    if (resultCQ == 'ready') {
                        Meteor.clearInterval(checkPriceQueueInterval);

                        // 2a - check for race conditions - when Requestprice is READY to process
                        let rc = raceConditionCheck(rp1.id, 'rp');
                        if (rc.status) {
                            rp1.pqId = pqId;
                            let results = requestpicesProcess(rp1);                                                     //ee async all - partially sync
                            QRPUfuture.return(results);
                        }
                        else {
                            // Delete price from queue
                            pricequeuesRemove(pqId, rp1.priceId);
                            QRPUfuture.return(rc);
                        }
                    }
                    else if (counter > 10) {
                        Meteor.clearInterval(checkPriceQueueInterval);

                        // Cancel if stuck in queue
                        let xprice = <Issue>{};
                        xprice.severity = 'HIGH';
                        xprice.priceId = rp1.priceId;
                        xprice.rpId = rp1.id;
                        xprice.pqId = pqId;
                        xprice.created = new Date().getTime();
                        xprice.note = 'Action Required - requestpricesQueueUpdate- pricequeues looped more than 10 times - waited longer than 2 seconds...';
                        xprice.status = 0;
                        Issues.insert(xprice);
                        // Delete price from queue
                        pricequeuesRemove(pqId, rp1.priceId);
                        QRPUfuture.return({
                            status: false,
                            error: 'requestpricesQueueUpdate: pricequeues looped more than 10 times - waited longer than 2.4 seconds...'
                        });
                    }

                }, 200);

            }
        }
    }

    return QRPUfuture.wait();
}



/**
 * Start Queue Process for users or cron request price
 *  - if PriceId is not in queue, lock queue and process immediately
 *  - if a PriceId already exist, enter into queue and process when ready "top of queue"
 *
 *  This method is called by DDP "Admin App", cron, and Client App
 *  for DDP calls, Meteor>userId() = null
 * 
 * @param rp 
 */
export function startQueueRequestProcess(rp: RequestPriceProcess) {

    // Create our future instance.
    let QRPfuture = new Future();

    // Insert new Request Prices with status = 0, processing....
    let rpi = <RequestPrice>{};
    rpi.priceId = rp.priceId;
    rpi.owner =  rp.userId;
    rpi.payRequest = rp.payRequest;
    rpi.requestedAt = rp.updated;
    rpi.expiresAt =  rp.expiresAt;
    rpi.updated = rp.updated;
    rpi.note = rp.note;
    rpi.status = rp.status;

    // 1 - insert new Requestprice - synchronous call - returns object
    let reqResults = requestpricesInsert(rpi);                                           

    rp.id = reqResults.rpId;
    rp.expiresAt = reqResults.expiresAt;

    if (!reqResults.status) {
        QRPfuture.return({
            status: false,
            error: 'startQueueRequestProcess: ' + reqResults.error
        });
    }
    else {
        // 2 - insert PriceId into Price Queue to lock other from processing PriceId
        let pqId = pricequeuesInsert(rp.priceId);                           

        if (pqId == 'error') {
            QRPfuture.return({
                status: false,
                error: 'Could not insert record into queue.'
            });
        }
        else {
            // 3 - check if ready in queue now before introducing delay from Meteor.setInterval
            let resultCQ = pricequeuesCheck(pqId, rp.priceId);                  

            if (resultCQ == 'ready') {
                console.log('******* Queue is available for Requestprice instantly:  rpId=' + rp.id + '  pqId=' + pqId);

                // 3 - check for race conditions - when Requestprice is READY to process
                let rc = raceConditionCheck(rp.id, 'rp');
                if (rc.status) {
                    rp.pqId = pqId;
                    let results = requestpicesProcess(rp); 
                    QRPfuture.return(results);
                }
                else {
                    // Delete price from queue
                    pricequeuesRemove(pqId, rp.priceId);
                    QRPfuture.return(rc);
                }
            }
            else {
                // 4 - loop for a while until priceQueue opens up for desired priceId
                let counter = 0;
                let checkPriceQueueInterval = Meteor.setInterval(function () {
                    counter++;

                    console.log("pricequeuesCheck method called " + counter + " times... id=" + pqId);
                    let resultCQ = pricequeuesCheck(pqId, rp.priceId);                  

                    if (resultCQ == 'ready') {
                        console.log('########## checkPriceQueueInterval cleared... ##########');
                        Meteor.clearInterval(checkPriceQueueInterval);

                        // tt -3a check for race conditions - when Requestprice is READY to process
                        let rc = raceConditionCheck(rp.id, 'rp');
                        if (rc.status) {
                            rp.pqId = pqId;
                            let results = requestpicesProcess(rp);  
                            QRPfuture.return(results);
                        }
                        else {
                            // Delete price from queue
                            pricequeuesRemove(pqId, rp.priceId);
                            QRPfuture.return(rc);
                        }
                    }
                    else if (counter > 12) {
                        Meteor.clearInterval(checkPriceQueueInterval);

                        // 5 - Cancel if stuck in queue - timeout after 12 * 200 = 2.4 seconds
                        // TODO delete inserted request price  -  keep it - hide from user leave status = 0
                        let xprice = <Issue>{};
                        xprice.severity = 'HIGH';
                        xprice.priceId = rp.priceId;
                        xprice.rpId = rp.id;
                        xprice.pqId = pqId;
                        xprice.created = new Date().getTime();
                        xprice.note = 'Action Required -startQueueRequestProcess- pricequeues looped more than 10 times - waited longer than 2.4 seconds...';
                        xprice.status = 0;
                        Issues.insert(xprice);

                        // Delete price from queue
                        pricequeuesRemove(pqId, rp.priceId);

                        QRPfuture.return({
                            status: false,
                            error: 'startQueueRequestProcess: pricequeues looped more than 10 times - waited longer than 2.4 seconds...'
                        });
                    }

                }, 200);
            }
        }
    }

    return QRPfuture.wait();
}



/**
 *
 * loop through each active requestsPrice for supplied priceId
 * set priceFactor to next level, if last level, expire price
 * collect new status, payout, and expiresAt info
 * return collect_info to update price and submitPrice entity
 *
 *  priceFactor: number;  0 = not processed, 1 = 1st submit processed, 2 = 2nd submit processed, 3 = 3rd submit processed
 *
 * 
 * @param sp1 
 */
export function requestpricesUpdates(sp1: SubmitPrice) {

    let Fiber = Npm.require('fibers');
    let Future = Npm.require('fibers/future');


    // 1 - retrieve all Requestprices with matching PriceId - smallest expiresAt come last
    let requestPrices = RequestPrices.find({
        priceId: sp1.priceId,
        status: 1
    }, {sort: {expiresAt: -1}}).fetch();

    let ExpireDate = 0;

    // 3 - loop through each Requestprice async - parent future is sync
    let futures = _.map(requestPrices, function (requestPrice) {
        let future = new Future();
        let onComplete = future.resolver();

        // 4 - Wrap in Async function - setTimeout = 0;
        setTimeout(function () {

            Fiber(function () {

                // 6b - payout has been fully paid.
                // assign full payout to user

                let payout = requestPrice.payRequest;
                let status = 2;
                // full payout has been paid.
                let priceFactor = 3;            
                let currentDate = new Date().getTime();


                // When updating "$push" it wraps paid in an array  [ ], if I paids.push(paid), it wraps it in a nested arrays [ [  ] ]
                let paid:PAIDTO = {
                    spId: sp1._id,
                    owner: sp1.owner,
                    paidAt: currentDate,
                    payout: payout,
                    status: 'paid pending'
                };

                // Update requestPrices to reflect new payout or close (status = 0)
                RequestPrices.update(requestPrice._id, {
                    $set: {
                        priceFactor: priceFactor,
                        status: status,
                        updated: currentDate,
                        note: sp1.note,
                    },
                    $push: {
                        paidTos: paid
                    }
                });

                // collect payout from each Requestprice
                let collect_info = {
                    id: requestPrice._id,
                    payout: payout,
                    expiresAt: ExpireDate,
                    status: status
                };
                onComplete(false, collect_info);

            }).run();

        });


        return future;
    });

    // wait for all futures to finish
    Future.wait(futures);

    // and grab the results out.
    return _.invoke(futures, 'get');
}


// ######################## Local functions #######################

function requestpicesProcess(rp1: RequestPriceProcess) {

    // Find min minExpiresAt for all active RequestPrices
    let minExpiresAt = 99999999999999;

    let paidTosAmount = 0;

    // find with fetch - makes call synchronous
    let ff = RequestPrices.find(
        { priceId: rp1.priceId,  status: 1},
        { expiresAt: 1 })
        .fetch();

    ff.map(x => {
        // console.log(x);
        if (x._id != rp1.id) {
            if (x.expiresAt < minExpiresAt) {
                minExpiresAt = x.expiresAt;
            }
            return x;
        }
        else {
            // Sum paid amounts for this Requestprice
            if (x.paidTos != undefined) {
                x.paidTos
                    .map(y => {
                        paidTosAmount += y.payout;
                        console.log(y);
                    });
            }

        }
    });

    let pu = <Price>{};
    pu._id = rp1.priceId;

    // Apply min expireAt to Price entity
    if (rp1.expiresAt < minExpiresAt) {
        pu.expiresAt = rp1.expiresAt;
    }
    else {
        pu.expiresAt = minExpiresAt;
    }

    pu.updated = 0;     // TODO - should I set to rp1.updated by default??

    if (rp1.note =='cancel-active') {
        pu.payoutRequest = rp1.payRequestOrig - rp1.payRequest;

        // should always be 0 or greater
        if (pu.payoutRequest < 0) {
            pricequeuesRemove(rp1.pqId, rp1.priceId);                           

            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.rpId = rp1.id;
            xprice.priceId = rp1.priceId;
            xprice.created = new Date().getTime();
            xprice.expiresAt = rp1.expiresAt;
            xprice.requestPayout = rp1.payRequest;
            xprice.sumPayout = pu.payoutRequest;
            xprice.note = 'Action Required - cancel requestpicesProcess() - payout request should always be greater than zero, payRequestOrig = ' + rp1.payRequestOrig;
            xprice.status = 0;
            Issues.insert(xprice);

            return {
                status: false,
                error: 'requestpicesProcess.invalid - Paid amount is greater than submitted payoutRequest on request.'
            };
        }
    }
    else if (rp1.note =='update-active') {
        // select payoutRequest calculation
        pu.payoutRequest = rp1.payRequest - rp1.payRequestOrig;
        pu.price = 0;
    }
    else {
        //ff note = request-new, cron-request-new
        pu.payoutRequest = rp1.payRequest;
        pu.updated = rp1.updated;
    }
    pu.note = rp1.note;

    // Update prices collection
    pu.submitterId = rp1.userId;
    pricesUpdate(pu);                                                                            

    // Update Request Prices collection
    let rp = <RequestPrice>{};
    rp._id = rp1.id;
    rp.payRequest = rp1.payRequest;
    rp.expiresAt = rp1.expiresAt;
    rp.updated = rp1.updated;
    rp.requestedAt = rp1.updated;
    rp.status = rp1.status;
    rp.note = rp1.note;
    rp.owner = rp1.userId;
    rp.payRequestOrig = rp1.payRequestOrig;

    if (rp.note =='cancel-active') {
        // Set status to 4 - cancel in the system
        let status = 4;
        requestpricesUpdateStatus(rp._id, status, rp.note, rp.payRequestOrig, rp.owner, paidTosAmount);    
    }
    else if (rp.note =='update-active') {
        // update requestPrice with new info
        requestPricesUpdate(rp);                                                      
    }
    else {
        // Set status to 1 - active in the system - ready to take submit prices
        let status = 1;
        requestpricesUpdateStatus(rp._id, status, rp.note, rp.payRequest, rp.owner, paidTosAmount);        
    }

    // Delete price from queue
    pricequeuesRemove(rp1.pqId, rp1.priceId);                                                               

    return {
        status: true
    }
}


