import { Meteor } from 'meteor/meteor';
import { Twilios } from '../../both/collections/twilios.collection';
import { Twilio } from '../../both/models/twilio.model';

let Future = Npm.require( 'fibers/future' );

/**
 * Insert new Twilio, one entry per user
 *
 * @param tw 
 */
export function twilioInsert(tw: Twilio) {
    // Create our future instance.
    let future = new Future();

    Twilios.insert(tw).subscribe(
        x => {
            console.log('true id here = ' + x);

            future.return({
                id: x,
                status: true
            });
        },
        err => {
            console.log(err);
            future.return({
                status: false,
                error: 'twilio.insert: unable to insert Twilio record'
            });
        }
    );

    return future.wait();
}


/**
 * update existing Twilio entry
 *
 * @param tw 
 * @param type 
 * @param cell1 
 */
export function twilioUpdate(tw: Twilio, type, cell1) {
    // Create our future instance.
    let future = new Future();

    let query = {};
    if (type == 'code') {
        query = {
            $set: {
                code: tw.code
            }
        };
    }
    else if (type == 'verifyCount') {
        query = {
            $set: {
                verifyCount: tw.verifyCount
            }
        };
    }
    else if (type == 'lock') {
        query = {
            $set: {
                lock: true
            }
        };
    }
    else {
        query = {
            $set: {
                currentSMSCount: tw.currentSMSCount,
                totalSMSCount: tw.totalSMSCount,
                lastSMSDate: tw.lastSMSDate,
                verifyCount: tw.verifyCount
            },
            $push: {
                cells: cell1
            }
        };
    }

    // Update Submit price
    Twilios.update(tw._id, query).subscribe(count => {
        if(!count) {
            future.return({
                status: false,
                error: 'twilio.update: unable to update Twilio record'
            });
        }
        else {
            future.return({
                status: true,
            });
        }

    });


    return future.wait();
}


/**
 * Send Twilio SMS
 * Dev test number is: 408-478-7086
 *
 * @param id 
 * @param cellphone 
 */
export function SendTwilioSMS2(id, cellphone) {

    // Override cellphone with development number
    cellphone = '4084787085';

    // Create our future instance.
    let future = new Future();

    // Ensure code is at least six digits
    let firstDigit = Math.floor(Math.random() * 9) + 1;
    let code = Math.round( ( Math.random() +  firstDigit ) * 100000 );
    let message = 'ZoJab Msg: Your security code is: ' + code + '.  Your code will expire in 5 minutes. Please don\'t reply.';

    // Save code in user's Twilio entry
    let tw = <Twilio>{};
    tw._id = id;
    tw.code = code;
    let res = twilioUpdate(tw, 'code', '');           
    console.log(res);

    if (res.status) {
        HTTP.call(
            "POST",
            'https://api.twilio.com/2010-04-01/Accounts/' +
            Meteor.settings.twilio.TWILIO_ACCOUNT_SID + '/SMS/Messages.json', {
                params: {
                    From: Meteor.settings.twilio.TWILIO_NUMBER,
                    To: cellphone,
                    Body: message
                },
                // Set your credentials as environment variables
                // so that they are not loaded on the client
                auth: Meteor.settings.twilio.TWILIO_ACCOUNT_SID + ':' +
                Meteor.settings.twilio.TWILIO_AUTH_TOKEN
            },
            // Print error or success to console
            function (error) {
                if (error) {
                    console.error(error);
                    future.return({
                        status: false,
                        error: error
                    });
                }
                else {
                    console.log('SMS sent successfully.');
                    future.return({
                        status: true
                    });
                }
            }
        );
    }
    else {
        future.return({
            status: false,
            error: res.error
        });
    }


    return future.wait();
}