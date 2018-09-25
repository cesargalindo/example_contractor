import { Meteor } from 'meteor/meteor';
import { Prices } from '../../../both/collections/prices.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

Meteor.publish('price', function(priceId: string) {
    let ff = Prices.find({
        _id: priceId
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER price " + priceId + " ###################### ==> " + ff.cursor.count());
    return ff;
});


Meteor.publish('pricesArray', function(ids: Object) {
    Counts.publish(this, 'numberOfPrices', Prices.collection.find({
        _id: { $in: ids}
    }), { noReady: true });

    let ff = Prices.find({
        _id: { $in: ids}
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER numberOfPrices ###################### ==> " + ff.cursor.count());
    return ff;
});


Meteor.publish('priceQuantity', function(storeId: string, itemId: string, quantity: string) {

    let ff = Prices.find({
        storeId: storeId,
        itemId: itemId,
        quantity: quantity,
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER pricesArray ###################### ==> " + ff.cursor.count());
    return ff;
});