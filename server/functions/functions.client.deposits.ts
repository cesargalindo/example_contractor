import { Meteor } from 'meteor/meteor';
import { Deposits } from '../../both/collections/deposits.collection';
import { Deposit } from '../../both/models/deposit.model';

import { Ledgers } from '../../both/collections/ledgers.collections';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

let Future = Npm.require( 'fibers/future' );


/**
 * 
 * @param dep 
 */
export function depositsInsert(dep: Deposit) {

    if ( Meteor.userId() ) {
        // Create our future instance.
        let future_insert = new Future();

        // dep._id =  'tjXqgsieREKWyHEHM';  // set to force error - duplicate key

        Deposits.insert(dep)
            .subscribe( x => {
                    console.log('true deposit ID here = ' + x);
                    future_insert.return({
                        id: x,
                        status: true
                    });
                },
                err => {
                    let xprice = <Issue>{};
                    xprice.severity = 'CRITICAL';
                    xprice.created = dep.created;
                    xprice.price = dep.amount;
                    xprice.note = 'Unable to insert new Deposit entry - email: ' + dep.customer.email + ' phone: ' + dep.customer.phone;
                    xprice.status = 0;
                    xprice.pqId = 'UserId: ' + Meteor.userId();
                    xprice.storeId = 'nonce: ' + dep.nonce;
                    xprice.extra = 'firstname: ' + dep.customer.firstname + ' lastname: ' + dep.customer.lastname;
                    Issues.insert(xprice);

                    future_insert.return({
                        status: false,
                        error: 'deposits.insert: unable to insert deposit'
                    });
                }
            );


        return future_insert.wait();
    }
    else {
        return {
            status: false,
            error: 'Error 109'
        }
    }

}


/**
 *  Update ledger balance and log deposit details
 *
 */
export function depositsUpdate(dep: Deposit, amount) {

    if ( Meteor.userId() ) {

        // Create our future instance.
        let future_update = new Future();

        // Request Balance is shifted by 2 decimals in Ledger
        amount = parseInt(amount * 100);
        console.log('--vv-- ' + Meteor.userId() + ' --vv-- ' + amount);

        // Update Ledger Request balance
        ledgersUpdate(
            'depositsUpdate',
            'deposits.update: unable to update existing deposit',
            { owner: Meteor.userId() },
            { requests: amount }
        );

        let id = dep._id;
        dep = _.omit(dep,'_id');

        // Update existing Deposit record
        Deposits.update(id, {
            $set: dep
        }).subscribe(count => {

            if(count) {
                future_update.return({
                    status: true
                });
            }
            else {
                let xprice = <Issue>{};
                xprice.depId = id;
                xprice.severity = 'CRITICAL';
                xprice.created = dep.updated;
                xprice.note = 'Unable to update existing deposit entry';
                xprice.status = 0;
                xprice.pqId = 'UserId: ' + Meteor.userId();
                xprice.storeId = 'transactionId: ' + dep.transaction.transactionId;
                xprice.extra = 'last4: ' + dep.transaction.last4 + ' expirationDate: ' + dep.transaction.expirationDate + ' cardType: ' + dep.transaction.cardType;
                Issues.insert(xprice);

                future_update.return({
                    status: false,
                    error: 'deposits.update: unable to update existing deposit'
                });
            }

        });

        return future_update.wait();

    }
}




/**
 *  Common function used to update Ledgers collection
 *
 *  a query and inc objects are passed in as parameters
 *
 */
export function ledgersUpdate(calledFrom: string, error: string, query: Object, inc: Object) {

    // Create our future instance.
    let future_update = new Future();

    // Update Ledger balance -- leave this update
    Ledgers.update(
        query,
        { $inc: inc }
    ).subscribe(count => {

        if(count) {
            future_update.return({
                status: true
            });
        }
        else {
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.created = new Date().getTime();
            xprice.note = calledFrom + ' - Unable to update Ledger';
            xprice.status = 0;
            xprice.pqId = 'UserId: ' + Meteor.userId();
            xprice.depId = 'Query contained in storeId, Inc contained in extra';
            xprice.storeId = JSON.stringify(query);
            xprice.extra = JSON.stringify(inc);
            Issues.insert(xprice);

            future_update.return({
                status: false,
                error: error
            });
        }

    });

    return future_update.wait();
}





