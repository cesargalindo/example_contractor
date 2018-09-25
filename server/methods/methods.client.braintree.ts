import { Meteor } from 'meteor/meteor';
import { Deposit } from '../../both/models/deposit.model';

import { depositsInsert, depositsUpdate } from '../functions/functions.client.deposits';

let Future = Npm.require( 'fibers/future' );
let braintree = require('braintree');
let env = braintree.Environment.Sandbox;

/**
 * Braintree Docs:  https://developers.braintreepayments.com/start/hello-server/node
 *
 */
if (Meteor.settings.environment === 'production') {
    env = braintree.Environment.Production;
}

const gateway = braintree.connect({
    environment: env,
    merchantId: Meteor.settings.braintree.merchantId,
    publicKey: Meteor.settings.braintree.publicKey,
    privateKey: Meteor.settings.braintree.privateKey,
});

console.log(env);
console.log(gateway.server);

Meteor.methods({


    'getClientToken'(clientId) {
        if ( this.userId ) {
            // Braintree is validating through their own script - clientId at this point is undefined
            check(clientId, Match.OneOf(undefined) );

            const generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
            const options = {};

            if (clientId) {
                options.clientId = clientId;
            }

            const response = generateToken(options);
            return response.clientToken;
        }
    },


    /**
     *
     */
    'gatewayTranasctionSale'(formValues, nonce) {
        if ( this.userId ) {
            check(nonce, String);
            check(formValues, {
                amount: Number,
                firstname: String,
                lastname: String,
                minitial: Match.Maybe(String)
            });

            // Create our future instance.
            let future = new Future();

            let dep = <Deposit>{};
            dep.created = new Date().getTime();
            dep.amount = formValues.amount;
            dep.nonce = nonce;
            dep.owner = this.userId;
            dep.status = 0; // processing
            dep.customer = {
                firstname: formValues.firstname,
                lastname: formValues.lastname,
                phone: this.userId,
                email: Meteor.user().emails[0].address
            };

            // 1 - Insert deposit, status = 0, processing begins
            let results = depositsInsert(dep);                                  

            if (results.status) {
                console.log(results);
                dep._id = results.id;

                //tt Meteor.bindEnvironment http://stackoverflow.com/questions/27769527/error-meteor-code-must-always-run-within-a-fiber
                // let nonce = 'sdsdfsaf';       // set to force error

                gateway.transaction.sale({
                        amount: dep.amount,
                        orderId: dep._id,
                        paymentMethodNonce: nonce,
                        customer: {
                            firstName: dep.customer.firstname,
                            lastName: dep.customer.lastname,
                            phone: dep.customer.phone,
                            email: dep.customer.email
                        },
                        options: {
                            submitForSettlement: true
                        }
                    },
                    Meteor.bindEnvironment(function(err, res) {

                        if (err) {
                            console.log("######## got an error --------------..... ");
                            console.log(err)
                            future.return({
                                status: false,
                                error: 'Deposit transaction error 1: ' + err,
                                id: dep._id
                            });
                        }
                        else {
                            if (res.success) {
                                console.log("Transaction ID: " + res.transaction.id + ' -- ' + res.success + ' -- ' + res.transaction.status);

                                let dep2 = <Deposit>{};
                                dep2._id = dep._id;
                                dep2.updated =  new Date().getTime();
                                dep2.status = 1; // success
                                dep2.transaction = {
                                    transactionId: res.transaction.id,
                                    status: res.transaction.status,
                                    last4: res.transaction.creditCard.last4,
                                    expirationDate: res.transaction.creditCard.expirationDate,
                                    cardType: res.transaction.creditCard.cardType
                                };

                                let updateResult = depositsUpdate(dep2, dep.amount);                                    

                                console.log(updateResult);
                                if (updateResult.status) {
                                    future.return({
                                        status: true,
                                        id: dep._id
                                });
                                }
                                else {
                                    future.return({
                                        status: false,
                                        error: 'Deposit transaction error 3: ' + updateResult.error,
                                        id: dep._id
                                    });
                                }

                            }
                            else {
                                console.log(res.message);
                                future.return({
                                    status: false,
                                    error: 'Deposit transaction error 4: ' + res.message,
                                    id: dep._id
                                });
                            }
                        }
                    }));

            }
            else {
                future.return({
                    status: false,
                    error: 'Error: unable to record deposit transaction. Please try again later.',
                    id: '--'
                });

            }

            return future.wait();
        }

    },


});


