import { Meteor } from 'meteor/meteor';
import { RequestPrice } from '../../both/models/requestprice.model';
import { RequestPriceProcess } from '../../both/models/helper.models';

import { Item } from '../../both/models/item.model';
import { Price } from '../../both/models/price.model';

import { infoModel } from '../functions/functions.client.misc';

Meteor.methods({


    /**
     *
     */
    'ddp.requestprices.insert.price.x'(p: Price, rp: RequestPrice, storeId: string, info: infoModel) {
        check(p, {
            itemId: String,
            payoutRequest: Number,
            updated: Number,
            expiresAt: Number,
            quantity: Match.Maybe(Number),
            price: Match.Maybe(Number),
            soldOut: Match.Maybe(Boolean),
            note: Match.Maybe(String)
        });
        check(rp, {
            priceId: Match.Maybe(String),
            itemId: String,
            payRequest: Number,
            expiresAt: Number,
            updated: Number,
            // status: Number,
            note: String
        });
        check(storeId, String);
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: Match.Maybe(String),
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        // Required for meteor build
        if (this.connection == undefined) {
            return {
                status: false,
                error: 'invalid 1010'
            }
        }
        else {
            // Verify ddp call was note made by a client
            if (this.connection.httpHeaders['user-agent'] == undefined) {
                return Meteor.call('requestprices.insert.price.x', p, rp, storeId, info);                   //ee async call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 1010'
                }
            }
        }
    },




    /**
     * Reject submitted price on this Requestprice
     *
     */
    'ddp.requestpricesQueue.reject'(rp1: RequestPriceProcess, info: infoModel) {
        check(rp1, {
            id: String,
            spId: String,
            userId: String
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: String,
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        // Required for meteor build
        if (this.connection == undefined) {
            return {
                status: false,
                error: 'invalid 1010'
            }
        }
        else {
            // Verify ddp call was note made by a client
            if (this.connection.httpHeaders['user-agent'] == undefined) {
                return Meteor.call('requestpricesQueue.reject', rp1, info);                   //ee async call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 101'
                }
            }
        }

    },


    /**
     * Update existing Requestprice through Queue
     *
     */
    'ddp.requestprices.update'(rp: RequestPrice, info: infoModel) {
        check(rp, {
            _id: String,
            priceId: Match.Maybe(String),
            payRequest: Number,
            expiresAt: Number,
            updated: Number,
            status: Match.Maybe(Number),
            owner: String,
            note: String
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: String,
            collection: Match.Maybe(String),
            id: Match.Maybe(String)
        });

        console.warn(info);

        // Required for meteor build
        if (this.connection == undefined) {
            return {
                status: false,
                error: 'invalid 1010'
            }
        }
        else {
            // Verify ddp call was note made by a client
            if (this.connection.httpHeaders['user-agent'] == undefined) {
                return Meteor.call('requestprices.update', rp, info);                      //ff sync call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 105'
                }
            }
        }

    },


    /**
     * Cancel existing requestPrice
     *
     */
    'ddp.requestprices.cancel'(rp: RequestPrice, info: infoModel) {
        check(rp, {
            _id: String,
            priceId: String,
            itemId: Match.Maybe(String),
            owner: String,
            note: String,
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: String,
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        // Required for meteor build
        if (this.connection == undefined) {
            return {
                status: false,
                error: 'invalid 1010'
            }
        }
        else {
            // Verify ddp call was note made by a client
            if (this.connection.httpHeaders['user-agent'] == undefined) {
                return Meteor.call('requestprices.cancel', rp, info);                       //ee async call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 102'
                }
            }
        }

    },



    /**
     * Update existing item, price, and requestPrice
     *
     */
    'ddp.requestprices.edit.price.item'(i: Item, p: Price, rp: RequestPrice, info: infoModel) {
        check(i, {
            _id: String,
            name: String,
            size: String,
            image: String,
            public: Number,
            category: String,
        });
        check(p, {
            _id: String,
            payoutRequest: Number,
            updated: Number,
            expiresAt: Number,
            quantity: Number,
        });
        check(rp, {
            _id: String,
            payRequest: Number,
            expiresAt: Number,
            updated: Number,
            requestedAt: Number,
            note: String,
            owner: String,
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: String,
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        // Required for meteor build
        if (this.connection == undefined) {
            return {
                status: false,
                error: 'invalid 1010'
            }
        }
        else {
            // Verify ddp call was note made by a client
            if (this.connection.httpHeaders['user-agent'] == undefined) {
                return Meteor.call('requestprices.edit.price.item', i, p, rp, info);    //ee async call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 103'
                }
            }
        }


    }


});


