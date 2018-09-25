import { Meteor } from 'meteor/meteor';

import { SubmitPrice } from '../../both/models/submitprice.model';
import { Price } from '../../both/models/price.model';
import { infoModel } from '../functions/functions.client.misc';

Meteor.methods({


    'ddp.submitprices.insert.price.x'(p: Price, sp: SubmitPrice, storeId: string, info: infoModel) {
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
        check(sp, {
            priceId: Match.Maybe(String),
            itemId: String,
            price: Number,
            payout: Number,
            soldOut: Boolean,
            // status: Number,
            note: String,
            owner:  Match.Maybe(String)
        });
        check(storeId, String);
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: Match.Maybe(String),
            collection: Match.Maybe(String),
            id: Match.Maybe(String)
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
                return Meteor.call('submitprices.insert.price.x', p, sp, storeId, info);                   //ee async call
            }
            else {
                return {
                    status: false,
                    error: 'invalid 101'
                }
            }
        }

    },


});


