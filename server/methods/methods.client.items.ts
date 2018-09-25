import { Meteor } from 'meteor/meteor';
import { Item } from '../../both/models/item.model';

import { itemsUpdate, itemsInsert, itemsInsertElasticsearch, itemDuplicateCheck } from '../functions/functions.client.items';
import { masterValidator, infoModel } from '../functions/functions.client.misc';

let Future = Npm.require( 'fibers/future' );


Meteor.methods({

    /**
     * Insert a new item
     *
     */
    'items.insert.byUser'(i: Item, info: infoModel) {
        check(i, {
            name: String,
            size: Number,
            unit: String,
            image: String,
            quantity: Match.Maybe(Number),
            public: Match.Maybe(Number)
        });

        // If Client called, initialize info object
        if (info == undefined) {
            info = new infoModel('', '', '', '', '', '', '');
        }
        else {
            check(info, {
                userId: String,
                adminKey: String,
                ownerId: String,
                collection: Match.Maybe(String),
                id: Match.Maybe(String)
            });
        }
        info.conn = this.connection;
        info.collection = 'skip';

        let res = masterValidator(info);                                            
        if (res.status) {

            let checkDup = itemDuplicateCheck(i);

            if (!checkDup.status) {
                return checkDup;
            }
            else {
                // Create our future instance.
                let future = new Future();

                i.quantity = 1;     // this item is shared by all prices with different quantities
                i.public = 1;       // make public by default - allow community to flag item as inappropriate
                i.status = 2;       // set to active by default - only used for user submitted items
                i.created = new Date().getTime();

                // DDP call
                if (res.callFrom == 'ddp') {
                    i.owner = info.userId;
                }
                else {
                    i.owner = this.userId;
                }

                let itemRes = itemsInsert(i);                                           

                if (!itemRes.status) {
                    future.return(itemRes);
                }
                else {
                    // Add new item to Elasticsearch
                    let ni = <Item>{};
                    ni._id = itemRes.id;
                    ni.name = i.name;
                    ni.size = i.size;

                    let resES = itemsInsertElasticsearch(ni);                               
                    if (!resES.status) {
                        future.return(resES);
                    }
                    else {
                        future.return({
                            status: true,
                            id: itemRes.id
                        });
                    }
                }

                return future.wait();
            }
        }
        else {
            return res;
        }
    },



    /**
     * Update existing item
     *
     */
    'items.update.byUser'(i: Item, info: infoModel) {
        check(i, {
            _id: String,
            name: String,
            size: Number,
            unit: String,
            image: String,
            public: Match.Maybe(Number)
        });

        // If Client called, initialize info object
        if (info == undefined) {
            info = new infoModel('', '', '', '', '', '', '');
        }
        else {
            check(info, {
                userId: String,
                adminKey: String,
                ownerId: String,
                collection: Match.Maybe(String),
                id: Match.Maybe(String)
            });
        }
        info.conn = this.connection;
        info.collection = 'item';
        info.id = i._id;

        let res = masterValidator(info);                                            
        if (res.status) {

            // Create our future instance.
            let future = new Future();

            i.note = 'update-item';

            let itemRes = itemsUpdate(i);                                           

            if (!itemRes.status) {
                future.return(itemRes);
            }
            else {
                let resES = itemsInsertElasticsearch(i);                            
                future.return(resES);
            }

            // Got error or looped through all stores, return status
            return future.wait();
        }
        else {
            return res;
        }
    },







});


