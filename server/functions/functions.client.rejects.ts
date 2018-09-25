import { Meteor } from 'meteor/meteor';
import { RequestPrices } from '../../both/collections/requestprices.collection';
import { SubmitPrices } from '../../both/collections/submitprices.collection';
import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';
import { RejectPrices } from '../../both/collections/rejectprices.collection';

import { RequestPriceProcess, RejectPriceProcess1 } from '../../both/models/helper.models';
import { ledgersUpdate } from './functions.client.deposits';

let Future = Npm.require( 'fibers/future' );

/**
 *
 * Update status of request Price paidTo array
 * Status field of Rejectprices = 8
 *
 * @param rejP 
 */
export function requestpricesUpdateReject(rejP: RejectPriceProcess1) {

    RequestPrices.update({
        _id: rejP.rpId, "paidTos.spId": rejP.spId
    }, {
        $set: {
            status: 8,
            updated: rejP.updated,
            note: rejP.note,
            "paidTos.$.status": rejP.status
        }
    }).subscribe(count => {

        let xprice = <Issue>{};
        xprice.severity = 'LegBal_10 - ' + rejP.status;
        xprice.rpId = rejP.rpId;
        xprice.spId = rejP.spId;
        xprice.created = rejP.updated;
        xprice.note = 'requestprices.update.reject - ' + rejP.note;
        xprice.status = rejP.status;
        xprice.requestPayout = rejP.paidAmount;
        xprice.pqId = Meteor.userId() + '  owner: ' + rejP.owner;
        Issues.insert(xprice);

        if(!count) {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.rpId = rejP.rpId;
            xprice.spId = rejP.spId;
            xprice.rejPId = rejP.id;
            xprice.created = rejP.updated;
            xprice.note = 'Action Required - requestprices.update.reject - unable to update RequestPrices with new paidTos status.';
            xprice.status = 0;
            Issues.insert(xprice);
        }
        else {
            // LegBal_10 - if (status == -1 && 'reject)  add rejP.paidAmount to requests-balance
                                                      // subtract from pendingRequests
            if ( (rejP.note == 'reject') && (rejP.status == -1) ) {
                let sum = -1 * rejP.paidAmount;

                // Update Ledger balance
                ledgersUpdate(
                    'requestpricesUpdateReject',
                    'Unable to update RequestPrices with new paidTos status',
                    { owner: rejP.owner },
                    { requests: rejP.paidAmount, pendingRequests: sum }
                );
            }
        }
    });

}


/**
 *
 */
export function rejectpriceInsert(rej) {

    // Create our future instance.
    let future = new Future();

    RejectPrices.insert({
        rpId: rej.rpId,
        spId: rej.spId,
        status: rej.status,
        submitted: rej.submitted,
        updated: rej.updated
    })
        .subscribe(
            x => {
                console.log('true RejectPrices here = ' + x);
                future.return({
                    status: true,
                    id: x
                });
            },
            err => {
                future.return({
                    status: false,
                    error: 'Unable to reject the following submitted price - spId=' + rej.spId + ' - ' + err
                });
            }
        );

    return future.wait();
}



/**
 * Update Submit price payout - was rejected or approved
 *
 * @param rejP 
 */
export function submitpricesUpdateReject(rejP: RejectPriceProcess1) {

    let sp = SubmitPrices.findOne({_id: rejP.spId});

    // calculate new payout
    let newPayout = sp.payout - rejP.paidAmount;

    // Ensure payout is never less than zero
    if (newPayout < 0) {
        let xprice = <Issue>{};
        xprice.severity = 'CRITICAL';
        xprice.rpId = rejP.rpId;
        xprice.spId = rejP.spId;
        xprice.rejPId = rejP.id;
        xprice.created = rejP.updated;
        xprice.note = 'Action Required - submitprices.update.reject - payout on Submitted price cannot be less than zero';
        xprice.status = 0;
        Issues.insert(xprice);
        newPayout = 0;
    }

    // Update Submit price
    SubmitPrices.update(rejP.spId, {
        $set: {
            payout: newPayout,
            updated: rejP.updated,
            note: rejP.note,
        }
    }).subscribe(count => {
        let xprice = <Issue>{};
        xprice.severity = 'SP_LegBal_10 - ' + rejP.status;
        xprice.rpId = rejP.rpId;
        xprice.spId = rejP.spId;
        xprice.created = rejP.updated;
        xprice.note = 'submitprices.update.reject - ' + rejP.note;
        xprice.status = rejP.status;
        xprice.requestPayout = rejP.paidAmount;
        xprice.pqId = Meteor.userId() + '  owner: ' + rejP.owner;
        Issues.insert(xprice);

        if(!count) {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.rpId = rejP.rpId;
            xprice.spId = rejP.spId;
            xprice.rejPId = rejP.id;
            xprice.created = rejP.updated;
            xprice.sumPayout = newPayout;
            xprice.note = 'Action Required - submitprices.update.reject - unable to update SubmitPrices with new payout.';
            xprice.status = 0;
            Issues.insert(xprice);
        }
        else {
            // Use sp.owner
            // SP_LegBal_10 - if (status == -1 && 'reject) remove rejP.paidAmount from pendingSubmits balance
            if ( (rejP.note == 'reject') && (rejP.status == -1) ) {
                rejP.paidAmount = -1 * rejP.paidAmount;

                // Update Ledger balance
                ledgersUpdate(
                    'submitpricesUpdateReject',
                    'Unable to update SubmitPrices with new payout',
                    { owner: sp.owner },
                    { pendingSubmits: rejP.paidAmount }
                );
            }
        }

    });


    return {status: true};
}



/**
 * Core rejectprice code
 *
 * @param rp1 
 */
export function rejectPriceProcess(rp1: RequestPriceProcess) {
    let currentDate = new Date().getTime();
    let paidAmount = 0;

    // findOne is syncronous on server side
    let requestPrices = RequestPrices.findOne({_id: rp1.id});

    if (requestPrices.paidTos != undefined) {
        requestPrices.paidTos
            .map(y => {
                if (rp1.spId == y.spId) {
                    paidAmount = y.payout;
                }
            });
    }

    let rejP = new RejectPriceProcess1();
    rejP.rpId = rp1.id;
    rejP.spId = rp1.spId;
    rejP.status = -1;               //set to 8 on update Requestprice
    rejP.submitted = currentDate;
    rejP.updated = currentDate;
    rejP.paidAmount = paidAmount;
    rejP.note = 'reject';
    rejP.owner = rp1.userId;
    
    let results = rejectpriceInsert(rejP);              
    if (!results.status) {
        return results;
    }
    else {
        rejP.id = results.id;
    }

    console.log("rejID = " + rejP.id );

    // Verify paidAmount is not equal to zero
    if (paidAmount == 0) {
        let xprice = <Issue>{};
        xprice.severity = 'CRITICAL';
        xprice.rpId = rp1.id;
        xprice.spId = rp1.spId;
        xprice.rejPId = rejP.id;
        xprice.created = currentDate;
        xprice.sumPayout = paidAmount;
        xprice.note = 'Action Required - paidAmount equals zero on a rejected submitted price';
        xprice.status = 0;
        Issues.insert(xprice);
    }

    // update Requestprices with rejection on a price submit
    requestpricesUpdateReject(rejP);                   //ee async call

    // update Submitprices - first update Price entity with reduced payout, then reject Submitprices
    submitpricesUpdateReject(rejP);                    //ee async call

    return { status: true };
}


