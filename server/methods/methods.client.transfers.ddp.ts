import { Meteor } from 'meteor/meteor';
import { Transfers } from '../../both/collections/transfers.collection';
import { Transfer } from '../../both/models/transfer.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { Items } from '../../both/collections/items.collection';

import { masterValidator, infoModel} from '../functions/functions.client.misc';

let Future = Npm.require( 'fibers/future' );

Meteor.methods({

    /**
     * Insert a new transfer by Admin
     *
     */
    'ddp.transfer.insert'(tr: Transfer, info: infoModel) {
        check(tr, {
            ownerFrom: String,
            ownerTo: String,
            status: Number,
            payment: Number,
        });

        // If Client called, initialize info object
        if (info == undefined) {
            info = new infoModel('', '', '', '', '', '', '');
        }
        else {
            check(info, {
                userId: String,
                adminKey: String,
                ownerId: Match.Maybe(String),
                collection: Match.Maybe(String),
                id: Match.Maybe(String)
            });
        }
        info.conn = this.connection;
        info.collection = 'skip';

        let res = masterValidator(info);                                            
        if (res.status) {
            // Create our future instance.
            let future = new Future();

            tr.created = new Date().getTime();

            // ss Execute mongo query to change owner
            // called by client App -- client can not alter public field        
            Items.update(
                { owner: tr.ownerFrom }, 
                { $set: { owner: tr.ownerTo } },
                { multi: true }
            )
            .subscribe(count => {
                if(!count) {
                    let xprice = <Issue>{};
                    xprice.severity = 'HIGH';
                    xprice.note = 'ACTION REQUIRED 132 - unable to transfer ownership -- count = 0';
                    xprice.status = 0;
                    xprice.extra = 'From: ' + tr.ownerFrom + ' To: ' + tr.ownerTo;
                    Issues.insert(xprice);

                    future.return({
                        status: false,
                        error: 'Unable to transfer item owner ship'
                    });
                }
                else {
                    tr.items = count;

                    // Insert new Transfer
                    Transfers.insert(tr)
                    .subscribe(
                        x => {
                            future.return({
                                status: true,
                                id: x,
                                count: count
                            } );
                        },
                        err => {
                            console.error(err);
                            future.return({
                                status: false,
                                error: 'Unable to insert transfer record',
                                count: count
                            });
                        }
                    );
                }
            });

            return future.wait();
        }
        else {
            return res;
        }
    },


    /**
     * Update existing item - method calls are only made through DDP
     */
    'ddp.transfers.get'(id: string, info: infoModel) {
        check(id, String);
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: Match.Maybe(String),
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        info.conn = this.connection;
        info.collection = 'skip';
        let res = masterValidator(info);

        if (res.status) {

            if (id == 'superbad') {
                let cnt = 0;
                let data = Transfers.find({}, { sort: {ownerFrom: 1}}).fetch();
    
                data.map(x => {
                    let uInfo = Meteor.users.find({ _id: x.ownerFrom }).fetch();
                    data[cnt].fromEmail = uInfo[0].emails[0].address;
                    cnt++;
                })

                return {
                    status: true,
                    data:  data
                }
            }
            else {
                let data = Transfers.find({
                    ownerFrom: id
                }).fetch();
    
                return {
                    status: true,
                    data:  data
                }
            }

            
        }
        else {
            return {
                status: false,
                error:  'E186 Could get transfers info.'
            };
        }

    },


     /**
      * this is a non-DDP call 
      */
    'transfers.get'() {
        if ( this.userId ) {
            let data = Transfers.find({
                ownerFrom: this.userId
            }).fetch();

            return {
                status: true,
                data:  data
            }
        }
    },

});


