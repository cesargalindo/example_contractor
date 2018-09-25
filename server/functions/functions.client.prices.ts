import { Meteor } from 'meteor/meteor';

import { Prices } from '../../both/collections/prices.collection';
import { Price } from '../../both/models/price.model';

import { Items } from '../../both/collections/items.collection';

import { Stores } from '../../both/collections/stores.collection';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { getGlobalSize } from '../functions/functions.client.misc';

let Future = Npm.require( 'fibers/future' );


/**
 * Price info is inserted into Elasticsearch through another process
 *
 * 
 * @param pi 
 */
export function pricesInsert(pi: Price) {

    console.log('--- start  11 ----- ' + pi.itemId + ' -- ' + pi.gsize + ' -- ' + pi.gunit );
        
    // retrieve item info to calculate gunits and gsize - include quantity value
    if ( (pi.gsize == undefined) || (pi.gunit == undefined)) {
        let item = Items.findOne({_id: pi.itemId});

        let gInfo = getGlobalSize(item.size, item.unit);

        pi.gsize = gInfo.gsize * pi.quantity;
        pi.gunit = gInfo.gunit;
        console.log('++++++++++++ pricesInsert ++++++++++++ gsize = ' + pi.gsize + '  gunit = ' + pi.gunit + '  quanity = ' + pi.quantity);
    }

    // Create our future instance.
    let future = new Future();

    pi.submittedAt = pi.updated;

    if ( (pi.note == 'insert-new-rp') || (pi.note == 'insert-new-rp-pending')) {
        // Requestprice - price value is null
        pi.price = 99999.06;
    }
    else if (pi.note == 'insert-new-sp') {
        // Submitprice - if SoldOut price = 99999.01
        if (pi.soldOut) {
            pi.price = 99999.01;
        }
        // Submitprice - expiresAt is 0
        pi.expiresAt = 0;
    }
    else {
        pi.price = pi.price / pi.gsize;        
    }

    // Omit soldOut key, there's no reason to store it - result is reflected in price
    pi = _.omit(pi,'soldOut');

    Prices.insert(pi)
        .subscribe(
            x => {
                console.log('--- start  22 ----- Price.insert id = ' + x);
                // this price is added to elastic search after an admin approves
                future.return({
                    status: true,
                    id: x
                });
            },
            err => {
                console.log(err);
                future.return({
                    status: false,
                    error: 'prices.insert: unable to insert price'
                });
            }
        );



    return future.wait();
}


/**
 *   Monitor payoutRequest changes on price updates - before and after
 *
 * @param pu 
 */
export function pricesUpdate(pu: Price) {

    if (!pu.updated) {
        pu.updated = new Date().getTime();
    }

    // Prep Issues collection in case it's needed
    let xprice = <Issue>{};
    xprice.priceId = pu._id;
    xprice.created = pu.updated;
    xprice.requestPayout = pu.payoutRequest;
    xprice.price = pu.price;
    xprice.severity = 'CRITICAL';
    xprice.status = 0;

    // sync call
    let priceExist = Prices.findOne({_id: pu._id});                         
    if (!priceExist) {
        xprice.note = 'ACTION REQUIRED - priceId does not exist on attempted price update -24- ' + pu.note;
        Issues.insert(xprice);
        return {status: false};
    }

    // update existing price entry

    if (pu.note == 'cancel-new') {
        // cancel new price whose item and request price are not active (new items)
        // price was never added to Elasticsearch so submittedAt timestamp is irrelevant
        Prices.update(pu._id, {
            $set: {
                updated: pu.updated,
                note: pu.note,
            }
        }).subscribe(count => {
            if (!count) {
                xprice.note = 'ACTION REQUIRED - cancel new price whose item and request price are not active (new items) -25- ' + pu.note;
                Issues.insert(xprice);
            }
        });
    }
    else if (pu.note == 'cancel-active') {
        // requestPrice was cancelled - subtract UNPAID Amount from price's current Payout
        // price should always contains the remaining difference
        // pu.payoutRequest contains the difference of new payout to original payout on priceRequest
        let payoutRequest = Math.round(priceExist.payoutRequest - pu.payoutRequest);

        Prices.update(pu._id, {
            $set: {
                payoutRequest: payoutRequest,
                expiresAt: pu.expiresAt,
                updated: pu.updated,
                note: pu.note,
            }
        }).subscribe(count => {
            if (!count) {
                xprice.sumPayout = payoutRequest;
                xprice.note = 'ACTION REQUIRED - requestPrice was cancelled - subtract UNPAID Amount from price current payout -26- ' + pu.note;
                Issues.insert(xprice);
            }
            else {
                pricesElasticesearchUpdate(priceExist.payoutRequest, payoutRequest, pu);
            }
        });
    }
    else if (pu.note == 'update-active') {
        // requestPrice was updated - add difference to existing payout - and update ExpireAt
        // pu.payoutRequeset contains the difference of new payout to original payout on priceRequest
        let payoutRequest = Math.round(pu.payoutRequest + priceExist.payoutRequest);
        Prices.update(pu._id, {
            $set: {
                payoutRequest: payoutRequest,
                expiresAt: pu.expiresAt,
                updated: pu.updated,
                note: pu.note,
            }
        }).subscribe(count => {
            if (!count) {
                xprice.sumPayout = payoutRequest;
                xprice.note = 'requestPrice was updated - add difference to existing payout - and update ExpireAt -27- ' + pu.note;
                Issues.insert(xprice);
            }
            else {
                pricesElasticesearchUpdate(priceExist.payoutRequest, payoutRequest, pu);
            }
        });
    }
    else if (pu.note == 'update-new') {
        // price, Requestprice is new - no one has submitted a price or another Requestprice
        Prices.update(pu._id, {
            $set: {
                payoutRequest: pu.payoutRequest,
                expiresAt: pu.expiresAt,
                updated: pu.updated,
                quantity: pu.quantity,
                note: pu.note,
            }
        }).subscribe(count => {
            if (!count) {
                xprice.note = 'price, request price is new - no one has submitted a price or additional request price -28- ' + pu.note;
                Issues.insert(xprice);
            }
        });
    }
    else if ((pu.note == 'request-new') || (pu.note == 'cron-request-new')) {
        // A new Requestprice is inserted to an existing Price entry which could have other Requestprices
        // SUM - Add full amount of requested price to existing payout,
        let payoutRequest = Math.round(pu.payoutRequest + priceExist.payoutRequest);
        Prices.update(pu._id, {
            $set: {
                payoutRequest: payoutRequest,
                expiresAt: pu.expiresAt,
                updated: pu.updated,
                note: pu.note,
            }
        }).subscribe(count => {
            if (!count) {
                xprice.sumPayout = payoutRequest;
                xprice.note = 'ACTION REQUIRED - SUM - Add full amount of requested price to existing payout -29- ' + pu.note;
                Issues.insert(xprice);
            }
            else {
                console.warn('====3===> ' + pu.note);
                pricesElasticesearchUpdate(priceExist.payoutRequest, payoutRequest, pu);
            }
        });
    }
    else {
        // User submitted a new price - pu.note == submit-new
        // user pre-calculated values passed into function -- used by submitPrice calls

        let truePrice = pu.price / priceExist.gsize;
        pu.soldOut = false;

        if ( ( pu.price < 99999.01)) {
            // truePrice = pu.price / priceExist.gsize;
        }
        else if (pu.price == 99999.01) {
            pu.soldOut = true;
            truePrice = pu.price;
        }
        else if (pu.price == 99999.06) {
            truePrice = pu.price;      
        }
        else {
            xprice.note = 'ACTION REQUIRED - unkown value of price detected - appears greater than 99999.06';
            Issues.insert(xprice);   
        }

        Prices.update(pu._id, {
            $set: {
                price: truePrice,
                submittedAt: pu.updated,
                submitterId: pu.submitterId,
                payoutRequest: pu.payoutRequest,
                expiresAt: pu.expiresAt,
                updated: pu.updated,
                note: pu.note,
                soldOut: pu.soldOut
            }
        }).subscribe(count => {
            if (!count) {
                xprice.note = 'ACTION REQUIRED - user pre-calculated values passed into function -- used by submitPrice calls -30- ' + pu.note;
                Issues.insert(xprice);
            }
            else {
                console.warn('====4===> priceExist.payoutRequest= '+  priceExist.payoutRequest + ' -- pu.payoutRequest=' + pu.payoutRequest + ' note= ' + pu.note);
                pricesElasticesearchUpdate(priceExist.payoutRequest, pu.payoutRequest, pu, true, priceExist.gsize);
            }
        });
    }

    return {status: true};
}


/**
 * Insert new Price entity into elasticSearch - when Admin approve through DDP
 * Approval is not required if submitting price on existing item for first time - SkipQueue
 * NOTE: actual price is not saved in ElasticSearch, only Quantity, Item and Store info
 * payoutRequest in Elasticsearch is either 0 or 1
 *
 * @param pi 
 */
export function pricesElasticesearchInsert(pi: Price) {

    // if synchronous - this will change to true on success
    let status = {status: false};                   
    let priceExist = Prices.findOne({_id: pi._id});

    if (!priceExist) {
        return ({
            status: false,
            error: 'pricesElasticsearchInsert: priceId does not exist: ' + pi._id
        });
    }

    // Set payout status for Elasticsearch
    let payout = 0;
    if (priceExist.payoutRequest) {
        payout = 1;
    }

    let item = Items.findOne({_id: pi.itemId});
    let gInfo = getGlobalSize(item.size, item.unit);    
    console.log('+++++++++++ item ++++++++++++++++ ' + pi.itemId + '  gsize = ' + gInfo.gsize + '  gunit = ' + gInfo.gunit);
    console.log(item);

    let store = Stores.findOne({_id: pi.storeId});
    console.log('+++++++++++++++++++ store +++++++++++++++++++++++++++ ' + pi.storeId );
    console.log(store);

    console.log('######### pricesElasticesearchInsert ITEM STORE ######## ' + priceExist.quantity + ' -- ' + item.name + ' -- ' + store.name);

    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL,
    });

    // Todo - make synchronous
    status = {
        status: true,
        storeInfo: {
            id: store._id,
            name: store.name,
            address: store.address
        }
    };

    // create a document index Elastic Search
    EsClientSource.index({
        index:  Meteor.settings.ES_INDEX_PRICES,
        type: "prices",
        body: {
            name: item.name + ', ' + item.size,
            id: pi._id,
            itemId: pi.itemId,
            storeId: pi.storeId,
            quantity: priceExist.quantity,
            price: priceExist.price,
            payoutRequest: payout,
            location: {
                lat: store.location.coordinates[1],
                lon: store.location.coordinates[0]
            },
            gsize: gInfo.gsize,
            gunit: gInfo.gunit
        }
    }, function (error, response) {

        if (error) {
            console.error("    <<<<<<<<<<<<<<<<<<<<< Could not insert due to " + error + " >>>>>>>>>>>>>>>>>>");
            let xprice = <Issue>{};
            xprice.severity = 'CRITICAL';
            xprice.priceId = pi._id;
            xprice.storeId = pi.storeId;
            xprice.itemId = pi.itemId;
            xprice.price = priceExist.price;
            xprice.extra = 'gsize= ' + gInfo.gsize + ' gunit= ' + gInfo.gunit;
            xprice.requestPayout = priceExist.payoutRequest;
            xprice.quantity = priceExist.quantity;
            xprice.created = pi.updated;
            xprice.note = 'Action Required - unable to insert new price into elasticSearch  - ' + error;
            xprice.status = 0;
            Issues.insert(xprice);
            status = {
                status: false,
                error: 'pricesElasticsearchInsert: unable to insert new price into elasticSearch - ' + error
            };
        }
        else {
            console.log(response);
            status = {
                status: true,
                storeInfo: {
                    id: store._id,
                    name: store.name,
                    address: store.address
                }
            };
        }

    });

    return status;
}

// ######################## Local functions #######################

/**
 *   Monitor payoutRequest changes on price updates - before and after
 *     a) if priceExist.payoutRequest > 0, and new payout > 0, leave Elasticsearch as is
 *     b) if priceExist.payoutRequest = 0, and new payout > 0, set payout = 1 in Elasticsearch
 *     c) if priceExist.payoutRequest > 0 and new payout =< 0, set payout = 0 in Elasticsearch
 *
 * 
 * @param origPayout 
 * @param newPayout 
 * @param pu 
 * @param updatePrice 
 * @param gsize 
 */
function pricesElasticesearchUpdate(origPayout, newPayout, pu, updatePrice = false, gsize = 1) {

    let update = 0;
    let payout = 0;

    if (origPayout) {
        if (newPayout <= 0) {
            payout = 0;
            update = 1;
        }
    }
    else if (newPayout) {
        payout = 1;
        update = 1;
    }

    let updateQuery = {
        payoutRequest: payout
    };

    if (updatePrice) {
        update = 1;
        updateQuery = {
            payoutRequest: payout,
            price: pu.price / gsize
        };
    }

    if (update) {
        let elasticsearch = require('elasticsearch');

        // create the client
        let EsClientSource = new elasticsearch.Client({
            host: Meteor.settings.ELASTICSEARCH_URL,
        });

        // the update-by-query API is new and should still be considered experimental. Use .update(...)
        // consequently I need to execute a query API and then update API
        // EsClientSource.update({ .... });

        let query = {
            "bool": {
                "filter": [
                    {
                        "term" : { "id" : pu._id }
                    }
                ]
            }
        };

        // Retrieve Elasticsearch id of a document so we can update it
        EsClientSource.search({
            index:  Meteor.settings.ES_INDEX_PRICES,
            type: "prices",
            body: {
                query: query
            }
        }).then(function (results) {

            // update a document in Elastic Search
            EsClientSource.update({
                index:  Meteor.settings.ES_INDEX_PRICES,
                type: "prices",
                id: results.hits.hits[0]._id,
                body: {
                    // put the partial document under the `doc` key
                    doc: updateQuery
                }
            }, function (err, res) {

                if (err) {
                    console.error(err);
                }
                else {
                    console.log(res);
                }
            });



        }, function (error) {
            console.error(error.message);
        });

    }
}

