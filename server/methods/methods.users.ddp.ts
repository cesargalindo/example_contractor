import { Meteor } from 'meteor/meteor';

import { masterValidator, infoModel} from '../functions/functions.client.misc';

let Future = Npm.require( 'fibers/future' );

Meteor.methods({


    /**
     * Update existing user - this method call is only made through DDP
     *
     */
    'ddp.users.update'(uu: Object, info: infoModel) {
        check(uu, {
            emailVerified: Boolean,
            cellVerified: Boolean,
            withdrawalStatus: Number,
            submitStatus: Number,
            requestStatus: Number,
            ownerId: String
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: Match.Maybe(String),
            collection: Match.Maybe(String),
            id: Match.Maybe(String)
        });

        info.conn = this.connection;
        info.collection = 'user';
        let res = masterValidator(info);                            //ff sync call

        console.error('ddp.users.update -- ' + uu.ownerId + ' -- ' + res.status);

        if (res.status) {
            // Create our future instance.
            let future = new Future();

            let res2 = Meteor.users.update( uu.ownerId, {
                $set: {
                    emails: [{
                        address: res.email,
                        verified: uu.emailVerified
                    }],
                    cellVerified: uu.cellVerified,
                    withdrawalStatus: uu.withdrawalStatus,
                    submitStatus: uu.submitStatus,
                    requestStatus: uu.requestStatus
                }
            });

            if (res2) {
                future.return({ status: true });
            }
            else {
                return {
                    status: false,
                    error:  'ERROR E107b -  Could not update user ' + + uu.ownerId
                };
            }

            return future.wait();
        }
        else {
            return {
                status: false,
                error:  'ERROR E109 - Could not update user ' + + uu.ownerId
            };
        }


    },


});