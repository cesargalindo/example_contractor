import { Meteor } from 'meteor/meteor';
import { Items } from '../../../both/collections/items.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';


/**
 * Publication of items by owner - used by contractor app
 */
Meteor.publish('itemsByOwner', function(options: Object) {
    if (!this.userId) {
        return this.ready();
    }

    // overwrite options - should I make it flexible??
    options = {
        limit: 20,
        skip: 0,
        sort: { created: -1 }
      };


    Counts.publish(this, 'numberOfItems', Items.collection.find({owner: this.userId}), { noReady: true });

    let ff = Items.find({owner: this.userId}, options);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER myrequestprices ###################### ==> " + ff.cursor.count());
    return ff;
});


/**
 * Just retrieve on item from server
 */
Meteor.publish('item', function(id: string) {

    let ff =  Items.find({
        _id: id
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER item " + id + " ###################### ==> " + ff.cursor.count());

    return ff;
});


Meteor.publish('itemsArray', function(ids: Object) {

    Counts.publish(this, 'numberOfItems', Items.collection.find({
        _id: { $in: ids}
    }), { noReady: true });

    let ff =  Items.find({
        _id: { $in: ids}
    });

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER itemsArray ###################### ==> " + ff.cursor.count());
    return ff;
});

