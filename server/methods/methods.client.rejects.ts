import { Meteor } from 'meteor/meteor';
import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { RequestPriceProcess } from '../../both/models/helper.models';
import { pricequeuesInsert, pricequeuesCheck, pricequeuesRemove } from '../functions/functions.client.pricequeues';
import { rejectPriceProcess } from '../functions/functions.client.rejects';
import { masterValidator, infoModel } from '../functions/functions.client.misc';
import { SubmitPrices } from "../../both/collections/submitprices.collection";

let Future = Npm.require( 'fibers/future' );


Meteor.methods({

    /**
     * I DON"T NEED to lock transaction with priceQueues - a price was already submitted
     * insert rejectPrices entry
     * set status on requestPrices: -> paidTos: -> status: -1
     * re-calculate payout amount and updated on submitPrices
     * subtract payout in requestPrices->paidTos-payout from payout in submitPrices
     *
     * Add queue solely for race conditions attempts by same user hitting multiple reject buttons at the same time
     */
    'requestpricesQueue.reject'(rp1: RequestPriceProcess, info: infoModel) {
        check(rp1, {
            id: String,
            spId: String,
            price: Number
        });

        // If Client called, initialize info object
        if (info == undefined) {
            info = new infoModel('', '', '', '', '', '', '');
            info.id = rp1.id;
            rp1.userId = this.userId;
            info.check2 = 'request';     // check requestStatus
        }
        else {
            check(info, {
                userId: String,
                adminKey: String,
                ownerId: Match.Maybe(String),
                collection: Match.Maybe(String),
                id: Match.Maybe(String),
            });
        }

        info.conn = this.connection;
        info.collection = 'rp';

        let res = masterValidator(info);                                               
        if (res.status) {

            // Verify submitters Submitted price is not identical to new submitted price
            let subPrice = SubmitPrices.findOne({_id: rp1.spId});
            if (rp1.price ==  subPrice.price) {
                return { status: false, error: 'New price can not equal rejected price.'};
            }

            // Create our future instance.
            let RPFuture = new Future();

            let pqId = pricequeuesInsert('rej-' + rp1.id);                              
            if (pqId == 'error') {
                RPFuture.return({
                    status: false,
                    error: 'Could not insert record into queue.'
                });
            }
            else {

                // tt check if ready in queue now before introducing delay from Meteor.setInterval
                let resultCQ = pricequeuesCheck(pqId, 'rej-' + rp1.id);                 

                if (resultCQ == 'ready') {
                    let resRP = rejectPriceProcess(rp1);                                

                    //tt Since above function rejectPriceProcess() is async, set a delay of 150ms
                    //tt this should allow sufficient time for logic to complete before clearing the queue
                    Meteor.setTimeout(function () {
                        // Delete price from queue
                        pricequeuesRemove(pqId, 'rej-' + rp1.id);
                        RPFuture.return(resRP);
                    }, 150);
                }
                else {

                    //tt-4 loop for a while until priceQueue opens up for desired rp1.id
                    let counter = 0;
                    let checkPriceQueueInterval = Meteor.setInterval(function () {
                        counter++;

                        let resultCQ = pricequeuesCheck(pqId, 'rej-' + rp1.id);

                        if (resultCQ == 'ready') {
                            Meteor.clearInterval(checkPriceQueueInterval);
                            let resRP = rejectPriceProcess(rp1);                        

                            // Since above function rejectPriceProcess() is async, set a delay of 150ms
                            // this should allow sufficient time for logic to complete before clearing the queue
                            Meteor.setTimeout(function () {
                                // Delete price from queue
                                pricequeuesRemove(pqId, 'rej-' + rp1.id);
                                RPFuture.return(resRP);
                            }, 150);

                        }
                        else if (counter > 12) {
                            Meteor.clearInterval(checkPriceQueueInterval);

                            // 5 - Cancel if stuck in queue - timeout after 12 * 200 = 2.4 seconds
                            let xprice = <Issue>{};
                            xprice.severity = 'HIGH';
                            xprice.priceId = rp1.priceId;
                            xprice.rpId = rp1.id;
                            xprice.pqId = pqId;
                            xprice.created = new Date().getTime();
                            xprice.note = 'Action Required -requestpricesQueue.reject- pricequeues looped more than 10 times - waited longer than 2.4 seconds...';
                            xprice.status = 0;
                            Issues.insert(xprice);

                            // Delete price from queue
                            pricequeuesRemove(pqId, 'rej-' + rp1.id);

                            RPFuture.return({
                                status: false,
                                error: 'Reject process timed out.'
                            });
                        }

                    }, 200);
                }
            }

            return RPFuture.wait();

        }
        else {
            return res;
        }

    },


});


