import { Items } from '../../both/collections/items.collection';
import { Item } from '../../both/models/item.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { getGlobalSize } from '../functions/functions.client.misc';

let Future = Npm.require( 'fibers/future' );

/**
 * update existing price - this function is only called by client
 *
 * @param iu 
 */
export function itemsUpdate(iu: Item) {
    console.log('ITEM UPDATE PUBLIC == ' + iu.public + ' == ' + ' note = ' + iu.note + ' size = ' + iu.size);

    if (iu.note == 'cancel-new') {

        Items.update(iu._id, {
            $set: {
                note: iu.note
            }
        }).subscribe(count => {
            if(!count) {
                let xprice = <Issue>{};
                xprice.itemId = iu._id;
                xprice.severity = 'HIGH';
                xprice.note = 'ACTION REQUIRED 101 - unable to update item ' + iu.note;
                xprice.status = 0;
                Issues.insert(xprice);
            }
        });
    }
    else if (iu.note == 'simplified-update') {
        // called by client App -- client can not alter public field        
        Items.update(iu._id, {
            $set: {
                name: iu.name,
                size: iu.size,
                unit: iu.unit,
                note: iu.note,
            }
        }).subscribe(count => {
            if(!count) {
                let xprice = <Issue>{};
                xprice.itemId = iu._id;
                xprice.severity = 'HIGH';
                xprice.note = 'ACTION REQUIRED 102 - unable to perform SIMPLIFIED item update ' + iu.note;
                xprice.status = 0;
                xprice.extra = 'name: ' + iu.name + ' size: ' + iu.size + ' unit: ' + iu.unit
                Issues.insert(xprice);
            }
        });
    }
    else  {
        // called by client App -- client can not alter public field        
        Items.update(iu._id, {
            $set: {
                name: iu.name,
                size: iu.size,
                unit: iu.unit,
                image: iu.image,
            }
        }).subscribe(count => {
            if(!count) {
                let xprice = <Issue>{};
                xprice.itemId = iu._id;
                xprice.severity = 'HIGH';
                xprice.note = 'ACTION REQUIRED 102 - unable to update item ' + iu.note;
                xprice.status = 0;
                xprice.extra = 'name: ' + iu.name + ' size: ' + iu.size + ' image: ' + iu.image
                Issues.insert(xprice);
            }
        });
    }


    return {status: true};
}


/**
 * Insert new item
 *
 * @param ni 
 */
export function itemsInsert(ni: Item) {

    // Create our future instance.
    let future = new Future();

    // In no image - add default image
    if (!ni.image) {
        ni.image =  Meteor.settings.public.GOOGLE_IMAGE_PATH  + Meteor.settings.public.GOOGLE_IMAGE_DEFAULT + 'no/' + Meteor.settings.public.GOOGLE_NO_IMAGE;
    }

    let data = {
        name: ni.name,
        size: ni.size,
        unit: ni.unit,
        quantity: ni.quantity,
        image: ni.image,
        public: ni.public
    };

    console.error('------3----- dp.items.insert.byAdmin -------3------ ni.owner = ' + ni.owner);

    // add owner and status
    if (ni.owner) {
        data = {
            //_id: 'msZtwwqP6KzE8ZTPf',  // use this to force an error
            owner: ni.owner,
            name: ni.name,
            size: ni.size,
            unit: ni.unit,
            quantity: ni.quantity,
            image: ni.image,
            public: ni.public,
            status: ni.status,
            created: ni.created
        };
    }

    // Insert new Item
    Items.insert(data)
        .subscribe(
            x => {
                console.error('------4----- dp.items.insert.byAdmin -------4------ itemID = ' + x);
                future.return({
                    status: true,
                    id: x
                } );
            },
            err => {
                console.log(err);
                future.return({
                    status: false,
                    error: 'Unable to insert item'
                });
            }
        );


    return future.wait();
}



/**
 * Check if item already exist
 * 
 * @param ni 
 */
export function itemDuplicateCheck(ni: Item) {

    let suItems = Items.find({
        name: ni.name,
        size: ni.size,
        unit: ni.unit
    }).fetch();

    if (suItems.length) {
        return {
            status: false,
            error: 'Duplicate item. This item name and size combination already exist.'
        }
    }
    else {
        return {
            status: true,
        }
    }

}


/**
 * Insert new approved item into Elasticsearch
 * 
 * @param ni 
 */
export function itemsInsertElasticsearch(ni: Item) {

    // loading the npm module
    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL
    });

    // Create our future instance.
    let future = new Future();

    let gInfo = getGlobalSize(ni.size, ni.unit,);

    // add a new Item entry into Elasticsearch
    EsClientSource.index({
        index:  Meteor.settings.ES_INDEX_ITEMS,
        type: "items",
        body: {
            name: ni.name + ', ' + ni.size + ' ' + ni.unit,
            id: ni._id,
            gunit: gInfo.gunit
        }
    }, function (error, response) {

        if (error) {
            future.return( {
                status: false,
                error: 'items.insert.elasticsearch -  Could not insert item - ' + error
            } );
        }
        else {
            console.log(response);
            future.return( { status: true } );

        }

    });

    return future.wait();
}


/**
 * Update existing item in Elasticsearch
 * 
 * @param iu 
 */
export function itemsUpdateElasticsearch(iu: Item) {

    // loading the npm module
    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL
    });

    // Create our future instance.
    let future = new Future();

    // the update-by-query API is new and should still be considered experimental. Use .update(...)
    // consequently I need to execute a query API and then update API
    let query = {
            "bool": {
                "filter": [
                    {
                        "term" : { "id" : iu._id }
                    }
                ]
            }
    };

    let gInfo = getGlobalSize(iu.size, iu.unit);
    
    // Retrieve Elasticsearch id of a document so we can update it
    EsClientSource.search({
        index:  Meteor.settings.ES_INDEX_ITEMS,
        type: "items",
        body: {
            query: query
        }
    }).then(function (results) {

        // update a document in Elastic Search
        EsClientSource.update({
            index:  Meteor.settings.ES_INDEX_ITEMS,
            type: "items",
            id: results.hits.hits[0]._id,
            body: {
                // put the partial document under the `doc` key
                doc: {
                    name: iu.name + ', ' + iu.size + ' ' + iu.unit,
                    gunit: gInfo.gunit            
                }
            }
        }, function (err, res) {

            if (err) {
                future.return( {
                    status: false,
                    error: 'items.update.elasticsearch 2 -  Could not update item - ' + err
                } );
            }
            else {
                future.return( { status: true } );
            }
        });



    }, function (error) {
        future.return( {
            status: false,
            error: 'items.update.elasticsearch 1 -  Could not update item - ' + error
        } );
    });


    return future.wait();
}