import { Meteor } from 'meteor/meteor';
import { Users } from '../../both/collections/users.collection';
import { Ledgers } from '../../both/collections/ledgers.collections';
import { Ledger } from '../../both/models/ledger.model';
import { SliderSettings } from '../../both/models/helper.models';

let Future = Npm.require( 'fibers/future' );

// Apolo Config
// import ApolloClient, { createNetworkInterface } from 'apollo-client';
// apollo imports
import { ApolloLink } from 'apollo-link';
import { ApolloClient } from 'apollo-client';
// import Cache from 'apollo-cache-inmemory';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';

import gql from 'graphql-tag';

let fetch = require('node-fetch');
global.fetch = fetch;

// Create Apollo Client
// const networkInterface = createNetworkInterface({
//     uri: Meteor.settings.public.GRAPHQL_URL,
//     headers: {
//         'Content-type': "application/json"
//     }
// });

// let client = new ApolloClient({
//     networkInterface
// });

const client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
    // cache: new Cache()
    // cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
});

// Construct Apollo GrapQL Queries
const initialUserData = gql`
    query UserInfoQuery($id: String) {
        apUserbyId(id: $id) {
            _id
            userProfile {
                firstname
                lastname
            }
            cellVerified
            ranking {
                score
                downVotes
                upVotes
                thumbsUp
                thumbsDown
            }
            settings {
                payRequestDefault
                payRequestMax
                minHoursDefault
                minHoursMax
                quantityDefault
                quantityMax
            }
            withdrawalStatus
            submitStatus
            requestStatus
            contractor {
                pictureQuality
                forceImageTranser
                capturePrice
            }
        }
    }
`;



Meteor.methods({

    /**
     * Retreive initial user data used by client
     *
     */
    'loadInitialUserData'() {
        console.log('xxxxxxxxx loadInitialUserData xxxxxxxxxx ' + Meteor.user().emails[0].address +  ' - ' + this.userId);

        if ( this.userId ) {

            // Create our future instance.
            let UserFuture = new Future();

            client.query({
                    query: initialUserData,
                    fetchPolicy: 'network-only',
                    variables: {
                        id: this.userId
                    }
                })
                .then((results) => {

                    console.warn(results.data.apUserbyId);

                    if (results.data.apUserbyId) {

                        UserFuture.return({
                            status: true,
                            data: results.data.apUserbyId
                        });
                    }
                    else {
                        UserFuture.return({
                            status: false,
                            error: 'Invalid user 45.'
                        });
                    }

                }).catch((error) => {
                    console.log('Encountered invalid user 55.', error);
                    UserFuture.return({
                        status: false,
                        error: 'Invalid user 55.'
                    });
                });


            return UserFuture.wait();
        }
    },


    /**
     * Send email verification link
     *
     */
    'sendVerificationLink'() {
        console.log('xxxxxxxxxxddddddddxxxxxxxxx xxxxxxxxxxx ' + Meteor.user().emails[0].address +  ' - ' + Meteor.user().emails[0].verified);
        if ( this.userId ) {
            let userId = this.userId;
            if ( userId ) {
                return Accounts.sendVerificationEmail( userId );
            }
        }

        //tt-6 - change username if it exist???
        // console.log('>>>>>>>> ' + Meteor.user().username + ' >>>>>>>>>> ' + this.userId);
        // if (Meteor.user().username) {
        //     Accounts.setUsername(this.userId,  'FB--' + Meteor.user().username);
        // }
    },


    /**
     * Update user profile Name info
     *
     */
    'updateUserProfile'(firstname, lastname) {
        if ( this.userId ) {
            check(firstname, String);
            check(lastname, String);

            firstname = firstname.trim();
            lastname = lastname.trim();

            if (!/^[a-zA-Z\s]+$/.test(firstname)) {
                return {
                    status: false,
                    error: 'ERROR: invalid First name entered'
                }
            }

            if (!/^[a-zA-Z\s]+$/.test(lastname)) {
                return {
                    status: false,
                    error: 'ERROR: invalid Last name entered.'
                }
            }

            // Copy over password service in addition to email and cellphone
            Meteor.users.update(  this.userId, {
                $set: {
                    userProfile: {
                        firstname: firstname,
                        lastname:  lastname,
                    },
                }
            });

            return { status: true };
        }

        return { status: false };
    },


    /**
     * Update user profile settings info
     *
     */
    'updateUserProfileSettings'(ss: SliderSettings) {

        if ( this.userId ) {
            check(ss, {
                payRequestDefault:Number,
                payRequestMax: Number,
                minHoursDefault: Number,
                minHoursMax: Number,
                quantityDefault: Number,
                quantityMax: Number
            });

            // Update user settings
            Meteor.users.update(  this.userId, {
                $set: {
                    settings: ss,
                }
            });

            return { status: true };
        }

        return { status: false };
    },


    /**
     * Update contractor user settings info
     *
     */
    'updateContractorUserSettings'(pictureQuality: number, forceImageTranser: boolean) {

        if ( this.userId ) {
            check(pictureQuality, Number);
            check(forceImageTranser, Boolean);
            
            // Update user settings
            Meteor.users.update(  this.userId, {
                $set: {
                    contractor: {
                        pictureQuality: pictureQuality
                    }
                }
            });

            return { status: true };
        }

        return { status: false };
    },


    /**
     * Update cellVerified
     *
     */
        'user.update.cellVerified'(status) {
        if ( this.userId ) {
            check(status, Boolean);

            Meteor.users.update( this.userId, {
                $set: {
                    cellVerified: status
                }
            });
        }
    },


    /**
     *
     */
    'user.thumbsUpClicked'(priceId) {
        if ( this.userId ) {
            check(priceId, String);

            return {
                status: true
            }
        }
    },



    /**
     * Initialize new user ledger
     * Grant user 25 requests which is added to ledger.requests
     */
    'initializeUserLedger'() {

        console.log('- - - -  User ledger initialize - - - ' + this.userId);

        if ( this.userId ) {

            let ledgerInfo = Ledgers.find({owner: this.userId})
                .fetch();

            console.log('----- ledgerInfo ======' + ledgerInfo.length);

            // insert insert if it doesn't exist for this user...
            if (!ledgerInfo.length) {

                let ledger = <Ledger>{};
                // TODO - determine Cordova stategy...
                // ledger.withdrawalStatus = 1;
                // ledger.submitStatus = 1;
                // ledger.requestStatus = 1;

                ledger.requests = Meteor.settings.REQUESTS.registration;
                ledger.balance = 0;
                ledger.pendingRequests = 0;
                ledger.pendingSubmits = 0;
                ledger.owner = this.userId;
                ledger.updated = new Date().getTime();
                ledger.created = ledger.updated;
                ledger.note = 'new user';
                Ledgers.insert(ledger).subscribe();
            }

        }

    },


    /**
     *  Change user password
     *
     */
    'setUserPassword'(password) {

        console.log('- - - - - - - - -  setUserPassword - - - - - - - - - - ' + this.userId);

        if ( this.userId) {
            check(password, String);

            let options = {logout: false};
            Accounts.setPassword(this.userId, password,  options);
            return true;
        }

        return false;
    },


    /**
     *  Apply default user settings for Facebook user on login and registration
     *
     */
    'updateFacebookLogin'() {

        let userId = this.userId;

        let userInfo = Users.find({ _id: userId})
            .fetch();

        console.log('- - - - - - - - - - - - -- - - -- - - - - -');
        console.log(userInfo);
        console.log('- - - - - - - - - - - - -- - - -- - - - - -');

        // TODO - grab cell phone number and store if available in userProfile??

        //tt apply default settings (email, cellphone) or copy existing user settings if user was overridden with FB account
        if (userInfo[0].emails == undefined) {

            console.error('EMAIL not defined...');

            //tt if Facebook user just over-rode existing email account, copy over existing password
            if (userInfo[0].services.password == undefined) {

                //tt check if FB user "copy"  exist;
                let userInfoFB = Users.find({ _id: 'FB__' + userInfo[0]._id})
                    .fetch();

                console.log(userInfoFB);

                //tt Copy password of existing Meteor account to new Facebook account if it exist
                if (userInfoFB.length) {
                    // Copy over password service in addition to email and cellphone
                    Meteor.users.update( userId, {
                        $set: {
                            services: {
                                facebook: userInfo[0].services.facebook,
                                resume:  userInfo[0].services.resume,
                                password:  userInfoFB[0].services.password
                            },
                            username: userInfoFB[0].services.password,

                            emails: [{
                                address: userInfo[0].services.facebook.email,
                                verified: userInfoFB[0].emails[0].verified
                            }],
                            // ff Ledger statuses are added in main.ts Accounts.onCreateUser
                            // withdrawalStatus: userInfoFB[0].withdrawalStatus,
                            // submitStatus: userInfoFB[0].submitStatus,
                            // requestStatus: userInfoFB[0].requestStatus,
                        }
                    });

                }
                else {
                    //tt-3 previous account doesn't exist - just update email
                    // TODO - get cellphone from Cordova - comming soon  - if logging in through web ignore cell-phone??
                    Meteor.users.update( userId, {
                        $set: {
                            emails: [{
                                address: userInfo[0].services.facebook.email,
                                verified: false
                            }]
                            // ff Ledger statuses are added in main.ts  Accounts.onCreateUser
                            // withdrawalStatus: 0,
                            // submitStatus: 1,
                            // requestStatus: 1,
                        }
                    });

                }

            }

        }


        return true;
    },


    /**
     *  Confirm cell phone number if available - not already used
     */
    'confirmCellphoneNumber'(cellPhoneNumber: string) {
        check(cellPhoneNumber, String);

        // Strip all characters from the input except digits
        cellPhoneNumber = cellPhoneNumber.replace(/\D/g, '');

        //tt-2 Get user ranking/score - fetch-synchronous call
        let userInfo = Users.find({ username: cellPhoneNumber})
            .fetch();

        // console.error('----- results of confirmCellphoneNumber ------');
        // console.error(userInfo);

        if (userInfo.length) {
            return false;
        }
        else {
            return true;
        }
    },


    /**
     *  Check if User is admin from Admin site
     */
    'checkAdminSiteUser'(userID: string) {
        check(userID, String);

        if (userID == Meteor.settings.ADMIN_KEY) {
            console.log("*** USER IS A SITE ADMIN USER ****");
            return true;
        }
        else {
            return false;
        }
    },


    /**
     *  Check Roles on server - alanning:roles is not reliable when calling from client
     */
    'checkRoles'(userID: string) {
        console.log('checkRoles - ID = ' + userID);

        return {
            admin: Roles.userIsInRole(userID, 'superadmin'),
            contractor: Roles.userIsInRole(userID, 'contractor'),
        };
    },


});

