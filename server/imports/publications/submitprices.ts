import { Meteor } from 'meteor/meteor';
import { SubmitPrices } from '../../../both/collections/submitprices.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

// Called by old My-Submitprices
// Meteor.publish('submitPricesRPIDSArray', function(ids: Object) {
//
//     //http://guide.meteor.com/data-loading.html
//
//     if (!this.userId) {
//         return this.ready();
//     }
//
//     let ff = SubmitPrices.find({
//         rpids: { $in: ids }
//     });
//
//     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER submitPricesRPIDSArray ###################### ==> " + ff.cursor.count());
//     return ff;
// });


Meteor.publish('mysubmitprices', function(options: Object) {
    //http://guide.meteor.com/data-loading.html

    if (!this.userId) {
        return this.ready();
    }

    Counts.publish(this, 'numberOfSubmitPrices', SubmitPrices.collection.find({
        owner: this.userId
    }), { noReady: true });

    //To make a query non reactive, simply pass { reactive: false } as an option.
    //var employees = Employees.find({}, {reactive: false}).fetch();
    // TODO - reactive does not work...  -- WORKS YOU ADD TO THE CLIENT...


    // return SubmitPrices.find({owner: this.userId});
    // let ff = SubmitPrices.find({owner: this.userId}, {reactive: false});
    let ff = SubmitPrices.find({owner: this.userId}, options);

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER mysubmitprices ###################### ==> "  + ff.cursor.count());
    return ff;
});

