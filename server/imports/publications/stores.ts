import { Meteor } from 'meteor/meteor';
import { Stores } from '../../../both/collections/stores.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';


/**
 * Just retrieve on item from server
 */
Meteor.publish('store', function(storeId: string) {
    let ff = Stores.find({
        _id: storeId
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER store " + storeId + " ###################### ==> " + ff.cursor.count());

    return ff;
});


Meteor.publish('storesArray', function(ids: Object) {

    Counts.publish(this, 'numberOfStores', Stores.collection.find({
        _id: { $in: ids}
    }), { noReady: true });

    let ff = Stores.find({
        _id: { $in: ids}
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER storesArray ###################### ==> " + ff.cursor.count());
    return ff;
});



Meteor.publish('storeGIDCheck', function(gid: string) {
    let ff = Stores.find(
        { gid: gid },
        { name: 1 }
    );

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER storeGIDCheck " + gid + " ###################### ==> " + ff.cursor.count());

    return ff;
});

