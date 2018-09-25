import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Twilios } from '../../both/collections/twilios.collection';
import { Twilio } from '../../both/models/twilio.model';

import { Random } from 'meteor/random';

import { twilioInsert, twilioUpdate, SendTwilioSMS2 } from '../functions/functions.client.twilio';


/**
 *
 * https://www.twilio.com/blog/2015/07/building-a-group-messaging-app-with-meteor-mongodb-and-twilio.html
 * User is allowed 5 SMS submissions per day
 *
 */
Meteor.methods({

    'verifyTwilioSMS' (code) {

        // Verify user of Client App is logged in
        if (this.userId) {

            check(code, Number);

            // block if user is cell phone has already been verified
            if (Meteor.user().cellVerified) {
                return {
                    status: false,
                    error: '--'
                }
            }

            let twInfo = Twilios.findOne({ owner: this.userId });
            if (twInfo == undefined) {
                return {
                    status: false,
                    error: 'Unknown user. Contact support.'
                }
            }

            // Increment verifyCount and ensure number of tries is not greater than 5
            if (twInfo.verifyCount == undefined) {
                twInfo.verifyCount = 1;
                let res = twilioUpdate(twInfo, 'verifyCount', '');          
                if (!res.status) {
                    return res;
                }
            }
            else if (twInfo.verifyCount >= 5) {
                return {
                    status: false,
                    error: 'You have exceeded number of allowed attempts. Please re-send a new SMS code.'
                }
            }
            else {
                twInfo.verifyCount++;
                let res = twilioUpdate(twInfo, 'verifyCount', '');          
                if (!res.status) {
                    return res;
                }
            }

            // check if code exist in user's Twilio entry
            // let result = Twilios.findOne({ owner: this.userId, code: parseInt(code) });
            if (twInfo.code == parseInt(code)) {
                // Success, update User's cellVerified
                Meteor.call('user.update.cellVerified', true);          //ee async call

                return {
                    status: true
                }
            }
            else {
                return {
                    status: false,
                    error: 'SMS code is invalid. Please try again.'
                }
            }
        }


    },


    /**
     *
     */
    'sendTwilioSMS' (cellPhone) {

        // Verify user of Client App is logged in
        if (this.userId) {

            // block if user is cell phone has already been verified
            if (Meteor.user().cellVerified) {
                return {
                    status: false,
                    error: '--'
                }
            }

            //provide slight delay to ensure username is updated
            let userId = this.userId;

            // find with fetch - makes call synchronous
            // let userInfo = Twilios.find({ owner: this.userId }).fetch();
            let twInfo = Twilios.findOne({ owner: userId });

            console.log('--------- userInfo --------- ' + cellPhone + ' -- ' + Meteor.user().username);
            console.log(twInfo);

            //tt If someone has this cellphone but has not verified it, grant it to this user??
            if ( (Meteor.user().username == undefined) || (Meteor.user().username != cellPhone) ) {
                // Ensure cellphone is not used by somebody else
                let userCheck = Meteor.users.findOne({username: cellPhone});

                // Cellphone does not exist
                if (userCheck == undefined) {
                    //tt-2 update this user's username with this cellphone
                    Accounts.setUsername(userId, cellPhone);
                }

                // Someone is already using this cellphone number
                else {

                    // Ensure cellphone has not been verified by someone else
                    if (userCheck.cellVerified) {
                        return {
                            status: false,
                            error: 'This cell phone number already in use.'
                        };
                    }

                    //tt-1 remove the username "cellphone from the other user
                    Accounts.setUsername(userCheck._id, Random.id());


                    Meteor.setTimeout(function () {
                        //tt-2 update this user's username with this cellphone
                        Accounts.setUsername(userId, cellPhone);
                    }, 150);
                }
            }


            if (twInfo == undefined) {
                let cell0:CELL = {
                    cellphone: cellPhone
                };
                let cell1 = new Array();
                cell1.push(cell0);

                let tw = <Twilio>{};
                tw.lock = false;
                tw.currentSMSCount = 1;
                tw.totalSMSCount = 1;
                tw.lastSMSDate = new Date().getTime();
                tw.owner = userId;
                tw.created = tw.lastSMSDate;
                tw.cells = cell1;

                let res = twilioInsert(tw);                 

                if (res.status) {
                    let results = SendTwilioSMS2(res.id, cellPhone);        
                    return results;
                }
                else {
                    return res;
                }
            }
            else {
                let currentTime = new Date().getTime();
                let expiredTime =  twInfo.lastSMSDate + 1000*60*60*24;

                if (twInfo.lock) {
                    return {
                        status: false,
                        error: 'You have exceeded allotted SMS submissions. Please try again in 24 hours.'
                    }
                }
                // reset currentSMSCount after 24 hours
                else if ( currentTime > expiredTime ) {
                    twInfo.currentSMSCount = 0;
                }
                // currentSMSCount is reset to 0 after user verifies SMS code
                else if (twInfo.currentSMSCount > 4) {
                    return {
                        status: false,
                        error: 'You have exceeded allotted SMS submissions. Please try again in 24 hours.'
                    }
                }

                let cell1:CELL = {
                    cellphone: cellPhone
                };

                // Prep Twilio info for update
                twInfo.currentSMSCount++;
                twInfo.totalSMSCount++;
                twInfo.lastSMSDate = currentTime;
                // reset verifyCount after each new SMS submission
                twInfo.verifyCount = 0;

                let res = twilioUpdate(twInfo, 'other', cell1);          

                if (res.status) {
                    let results = SendTwilioSMS2(twInfo._id, cellPhone);        
                    return results;
                }
                else {
                    return res;
                }

            }
        }
        else {
            return {
                status: false,
                error: 'not logged in'
            }
        }

    },






});


