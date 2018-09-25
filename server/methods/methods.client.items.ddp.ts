import { Meteor } from 'meteor/meteor';
import { Items } from '../../both/collections/items.collection';
import { Item } from '../../both/models/item.model';

import { masterValidator, infoModel} from '../functions/functions.client.misc';
import { itemsInsert, itemsInsertElasticsearch, itemDuplicateCheck } from '../functions/functions.client.items';

let Future = Npm.require( 'fibers/future' );

Meteor.methods({


    /**
     * Insert a new item by Admin
     *
     */
    'ddp.items.insert.byAdmin'(i: Item, info: infoModel) {
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
                ownerId: Match.Maybe(String),
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
                i.created = new Date().getTime();
                // i.status = 2;       // set to active by default - only used for user submitted items

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
                    ni.unit = i.unit;

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
     * Update existing item - method calls are only made through DDP
     * Call is sync through fibers
     */
    'ddp.items.update'(iu: Item, info: infoModel) {
        check(iu, {
            _id: String,
            name: Match.Maybe(String),
            size: Match.Maybe(Number),
            unit: Match.Maybe(String),
            image: Match.Maybe(String),
            public: Match.Maybe(Number),
            category: Match.Maybe(String),
            note: Match.Maybe(String)
        });
        check(info, {
            userId: String,
            adminKey: String,
            ownerId: Match.Maybe(String),
            collection: Match.Maybe(String),
            id: Match.Maybe(String),
        });

        info.conn = this.connection;
        info.collection = 'skip';
        info.id = iu._id;
        let res = masterValidator(info); 

        // if note is undefined set = '' to all  .includes(...) check
        if (iu.note == undefined) {
            iu.note = '';
        }

        if (res.status) {

            // Create our future instance.
            let future = new Future();

            if (iu.note == 'cancel-new') {
                Items.update(iu._id, {
                    $set: {
                        note: iu.note
                    }
                }).subscribe(count => {
                    if (count) {
                        future.return({ status: true });
                    }
                    else {
                        future.return ({
                            status: false,
                            error:  'Could not update item ' + iu.note + ' - ' + iu._id
                        });
                    }
                });
            }
            else if (iu.note == 'ddp-approve') {
                Items.update(iu._id, {
                    $set: {
                        public: iu.public,
                    }
                }).subscribe(count => {
                    if (count) {
                        future.return ({ status: true });
                    }
                    else {
                        future.return ({
                            status: false,
                            error:  'E104 Could not update item ' + iu.note + ' - ' + iu._id
                        });
                    }
                });
            }
            else if ( (iu.note == 'contractor') || iu.note.includes(':contractor') ) {
                // called by Contractor in Admin app
                let rollBackTime =  new Date().getTime();
                // Roll created date back one month
                rollBackTime = rollBackTime - 2592000;

                Items.update(iu._id, {
                    $set: {
                        name: iu.name,
                        size: iu.size,
                        unit: iu.unit,
                        image: iu.image,
                        public: iu.public,
                        category: iu.category,
                        created: rollBackTime,
                        note: iu.note,
                    }
                }).subscribe(count => {
                    if (count) {
                        future.return ({ status: true });
                    }
                    else {
                        future.return ({
                            status: false,
                            error:  'E105 Could not update item ' + iu.note + ' - ' + iu._id
                        });
                    }
                });
            }
            else  {
                // called by client App -- client can not alter public field
                // Item quantity will always be = 1
                Items.update(iu._id, {
                    $set: {
                        name: iu.name,
                        size: iu.size,
                        unit: iu.unit,
                        image: iu.image,
                        public: iu.public,
                        category: iu.category
                    }
                }).subscribe(count => {
                    if (count) {
                        future.return ({ status: true });
                    }
                    else {
                        future.return ({
                            status: false,
                            error:  'E105 Could not update item ' + iu.note + ' - ' + iu._id
                        });
                    }
                });
            }

            return future.wait();
        }
        else {
            return {
                status: false,
                error:  'E106 Could not update item ' + iu.note + ' - ' + iu._id
            };
        }


    },

});


