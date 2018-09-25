import { Meteor } from 'meteor/meteor';
import { RequestPrices } from '../../../both/collections/requestprices.collection';
// import { Counts } from 'meteor/tmeasday:publish-counts';


// Meteor.publish('myrequestprices', function(options: Object) {
//
//     console.log('======>>>> 111 >>>> myrequestprices <<<<< 1111 <<<<<========= ' +  this.userId);
//
//     //http://guide.meteor.com/data-loading.html
//     if (!this.userId) {
//         return this.ready();
//     }
//
//     //To make a query non reactive, simply pass { reactive: false } as an option.
//     //return RequestPrices.find({owner: this.userId}, {reactive: false});
//
//     Counts.publish(this, 'numberOfRequestPrices', RequestPrices.collection.find({
//         owner: this.userId
//     }), { noReady: true });
//
//
//     console.log(options);
//
//     let ff = RequestPrices.find({owner: this.userId}, options);
//
//     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER myrequestprices ###################### ==> " + ff.cursor.count());
//     return ff;
// });


Meteor.publish('myrequestprice', function(id: string) {

    //http://guide.meteor.com/data-loading.html
    if (!this.userId) {
        return this.ready();
    }

    let ff = RequestPrices.find({
            _id: id,
            owner: this.userId
        },
        {
            reactive: false
        });


    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER myrequestprice " + id + " ###################### ==> " + ff.cursor.count());
    return ff;
});

