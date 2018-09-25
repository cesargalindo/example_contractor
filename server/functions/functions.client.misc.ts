import { Meteor } from 'meteor/meteor';
import { Users } from '../../both/collections/users.collection';
import { RequestPrices } from '../../both/collections/requestprices.collection';
import { RequestPrice } from '../../both/models/requestprice.model';
import { SubmitPrices } from '../../both/collections/submitprices.collection';
import { Items } from '../../both/collections/items.collection';
import { Ledgers } from '../../both/collections/ledgers.collections';

export class infoModel {
    constructor(
        public userId: string,
        public adminKey: string,
        public ownerId: string,
        public collection: string,
        public id: string,
        public conn: Object,
        public check2: string       // check withdrawlStatus or submitStatus or requestStatus
    ) {  }
}



/**
 *  Validate Client or DDP calls are legit
 *
 * Client call - confirm user is logged in
 * Client/DDP call - ownerId is owner of Submitprice or Requestprice entity - not always required depending on call i.e. inserts
 * DDP Call - userId from ddp matches userId residing on client server - email matches user's email on Admin server
 * DPP Call - Admin key contained in both client and admin settings file - must match,  SSL required so it makes sense to use
 *
 *  info:  { userId:  "zzz", adminKey: "zzz", ownerId: "zzz", collection: "rp", id: "zzz"}
 * @param info 
 */
export function masterValidator(info: infoModel) {

    console.error('------- masterValidator -------- id: ' + info.id + '  owner: ' + info.ownerId + '  userId: ' + Meteor.userId());
    console.error(info);
    console.error('####################################');

    // NOT a Client/Cordova call, assume it's a DDP call
    if ( (info.conn.httpHeaders['user-agent'] == undefined) || (info.conn.httpHeaders['user-agent'] == 'Go-http-client/1.1') ) {

        // Verify userId exist
        let userInfo = Users.find({ _id: info.userId})
            .fetch();

        if (userInfo.length) {

            // Verify admin Key
            if (info.adminKey == Meteor.settings.ADMIN_KEY) {

                // Verify OwnerId of Requestprices entry is valid
                if (info.collection == 'rp') {

                    let reqPrices = RequestPrices.find({
                        _id: info.id,
                        owner: info.ownerId
                    }).fetch();

                    if (reqPrices.length) {
                        return {
                            status: true,
                            callFrom: 'ddp',
                            xstatus: reqPrices[0].status
                        }
                    }
                    else {
                        return {
                            status: false,
                            error: 'Invalid user 102'
                        }
                    }
                }
                // Verify OwnerId of Submitprices entry is valid
                else if (info.collection == 'sp') {

                    let subPrices = SubmitPrices.find({
                        _id: info.id,
                        owner: info.ownerId
                    }).fetch();

                    if (subPrices.length) {
                        return {
                            status: true,
                            callFrom: 'ddp',
                            xstatus: subPrices[0].status
                        }
                    }
                    else {
                        return {
                            status: false,
                            error: 'Invalid user 103'
                        }
                    }
                }
                // Verify user "ownerId" exisit - return email
                else if (info.collection == 'user') {
                    let userInfo = Users.find({ _id: info.ownerId}).fetch();
                    if (userInfo.length) {
                        return {
                            status: true,
                            callFrom: 'ddp',
                            email: userInfo[0].emails[0].address
                        }
                    }
                    else {
                        return {
                            status: false,
                            error: 'Invalid user 107x'
                        }
                    }
                }
                // No need to Verify an entry, most likely a new insert
                else {
                    return {
                        status: true,
                        callFrom: 'ddp',
                    }
                }
            }
            else {
                return {
                    status: false,
                    error: 'Invalid user 104'
                }
            }
        }
        else {
            return {
                status: false,
                error: 'Invalid user 105'
            }
        }


    }
    else {
        //Client Call - Verify user is logged in
        if (Meteor.userId()) {

            if (info.check2 == 'submit') {
                if (!Meteor.user().submitStatus) {
                    return {
                        status: false,
                        error: 'You do not have submit permissions. Please contact support.'
                    }
                }
            }
            else if (info.check2 == 'request') {
                if (!Meteor.user().requestStatus) {
                    return {
                        status: false,
                        error: 'You do not have request permissions. Please contact support.'
                    }
                }
            }
            else if (info.check2 == 'withdraw') {
                if (!Meteor.user().withdrawalStatus) {
                    return {
                        status: false,
                        error: 'You do not have withdraw permissions. Please contact support.'
                    }
                }
            }

            // Verify user is owner of Requestprice collection entry
            if (info.collection == 'rp') {

                let reqPrices = RequestPrices.find({
                    _id: info.id,
                    owner: Meteor.userId()
                }).fetch();


                if (reqPrices.length) {
                    return {
                        status: true,
                        callFrom: 'client',
                        xstatus: reqPrices[0].status
                    }
                }
                else {
                    return {
                        status: false,
                        error: 'Invalid user 114'
                    }
                }
            }
            // Verify user is owner of Submitprices collection entry
            else if (info.collection == 'sp') {

                let subPrices = SubmitPrices.find({
                    _id: info.id,
                    owner: Meteor.userId()
                }).fetch();

                if (subPrices.length) {
                    return {
                        status: true,
                        callFrom: 'client',
                        xstatus: subPrices[0].status
                    }
                }
                else {
                    return {
                        status: false,
                        error: 'Invalid user 115'
                    }
                }
            }
            // Verify user is owner of Submitprices collection entry
            else if (info.collection == 'item') {

                let suItems = Items.find({
                    _id: info.id,
                    owner: Meteor.userId()
                }).fetch();

                if (suItems.length) {
                    return {
                        status: true,
                        callFrom: 'client',
                        xstatus: suItems[0].status
                    }
                }
                else {
                    return {
                        status: false,
                        error: 'Invalid user 115'
                    }
                }
            }
            else {
                // Check owner of collection not required
                return {
                    status: true,
                    callFrom: 'client'
                }
            }
        }
        else {
            return {
                status: false,
                error: 'Invalid user 116'
            }
        }
    }


}


/**
 * Confirm current requestprice or submitprice status are valid - allowed access by users
 * NOTE: Users "multiple" are only allowed to update requestprices and submitprices when their
 * status = 9, -1, 1 for requestprices or status = -1, 1 for submitprices
 * Cron is the only entity that will alter the status's of requestprices and submitprices later
 *
 * @param id 
 * @param coll 
 */
export function raceConditionCheck(id: string, coll: string) {

    if (coll == 'rp') {
        let reqPrices = RequestPrices.find({
            _id: id
        }).fetch();

        // added -99 to ensure index is never 0 if status is valid
        let checkArray = [-99, 9, -1, 1];

        if (_.indexOf(checkArray, reqPrices[0].status) > 0) {
            return {
                status: true
            }
        }
        else {
            return {
                status: false,
                error: 'This request is no longer active.'
            };
        }
    }
    else if (coll == 'sp') {
        let subPrices = SubmitPrices.find({
            _id: id
        }).fetch();

        // added -99 to ensure index is never 0 if status is valid
        let checkArray = [-99, -1, 1];

        if (_.indexOf(checkArray, subPrices[0].status) > 0) {
            return {
                status: true
            }
        }
        else {
            return {
                status: false,
                error: 'This request is no longer active.'
            };
        }
    }
    else {
        return {
            status: false,
            error: 'Invalid request.'
        }
    }

}


/**
 *  Return true is user Email and Cellphone is not verified
 * 
 */
export function userNotVerified() {
    if (Meteor.user()) {
        if (Meteor.user().emails[0].verified && Meteor.user().cellVerified) {
            return false;
        }
    }
    return true;
}



/**
 *  Verify user has sufficient funds in ledger for this request
 *  
 * @param rp 
 * @param ddpCall 
 */
export function checkLedgerBalance(rp: RequestPrice, ddpCall: string) {
    let owner = Meteor.userId();

    // DDP call
    if (ddpCall == 'ddp') {
        owner =  rp.owner;
    }

    let ledgerInfo = Ledgers.find({owner: owner})
        .fetch();

    console.log('----- ledgerInfo ======' + ledgerInfo.length + ' -- ' + ledgerInfo[0].requests + ' -- ' + rp.payRequest);

    console.log(ledgerInfo);

    // Proceed if user has LedgerInfo
    if (ledgerInfo.length) {
        //  Since every request is worth 1 cent, we just need to check if ledger.requests > 0
        // if (ledgerInfo[0].balance >= rp.payRequest) {
        if (ledgerInfo[0].requests) {
            return {
                status: true
            }
        }
        else {
            return {
                status: false,
                error: 'Insufficient funds'
            }
        }
    }
    else {
        return {
            status: false,
            error: 'Insufficient funds'
        }
    }

}


/**
 *  Percentage payout based on user ranking
 *
 * @param score 
 */
export function payoutCalculator(score) {

    let payoutPercentages = {};
    payoutPercentages[0] = 0;
    payoutPercentages[0.5] = 0;
    payoutPercentages[1.0] = 0.15;
    payoutPercentages[1.5] = 0.30;
    payoutPercentages[2.0] = 0.45;
    payoutPercentages[2.5] = 0.51;
    payoutPercentages[3.0] = 0.56;
    payoutPercentages[3.5] = 0.62;
    payoutPercentages[4.0] = 0.66;
    payoutPercentages[4.5] = 0.70;
    payoutPercentages[5.0] = 0.75;

    return payoutPercentages[score];
}


/**
 * A dupicate copy of this function also resides on client code in ElasticSearchService.ts
 * 
/**
 * 1 lb	--> 16 oz
 * 1 kg	-->  35.274 oz
 * 1 gm	--> 0.035274 oz
 *
 * 1 gal --> 128 fl oz
 * 1 lt	--> 33.814 fl oz
 * 1 qt	--> 32 fl oz
 * 1 pt	--> 16 fl oz
 * 1 cup --> 8 fl oz
 * 1 ml --> 0.033814 fl oz
 *
 */
export function getGlobalSize(size: number, unit: string) {
    let gsize = 0;
    let gunit = '';

    // WEIGHT
    if (unit == 'lb') {
        gsize = size * 16;
        gunit = 'oz';
    }
    else if (unit == 'kg') {
        gsize = size * 35.274;
        gunit = 'oz';
    }
    else if (unit == 'gm') {
        gsize = size * 0.035274;
        gunit = 'oz';
    }
    else if (unit == 'oz') {
        gsize = size;
        gunit = 'oz';
    }
    // VOLUME
    else if (unit == 'gal') {
        gsize = size * 128;
        gunit = 'fl oz';
    }
    else if (unit == 'lt') {
        gsize = size * 33.814;
        gunit = 'fl oz';
    }
    else if (unit == 'qt') {
        gsize = size * 32;
        gunit = 'fl oz';
    }
    else if (unit == 'pt') {
        gsize = size * 16;
        gunit = 'fl oz';
    }
    else if (unit == 'cup') {
        gsize = size * 8;
        gunit = 'ml';
    }
    else if (unit == 'fl oz') {
        gsize = size;
        gunit = 'fl oz';
    }
    else if (unit == 'ml') {
        gsize = size * 0.033814;
        gunit = 'ml';
    }
    else if (unit == 'ct') {
        gsize = size;
        gunit = 'ct';
    }

    return {
        gsize: gsize,
        gunit: gunit
    }
}




