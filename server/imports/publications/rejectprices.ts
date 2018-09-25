import { Meteor } from 'meteor/meteor';
import { RejectPrices } from '../../../both/collections/rejectprices.collection';

Meteor.publish('myrejectprices', function() {

    if (!this.userId) {
        return this.ready();
    }

    //To make a query non reactive, simply pass { reactive: false } as an option.
    let ff =  RejectPrices.find(
        {
            owner: this.userId
        },
        {
            reactive: false
        }
    );

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER myrejectprices ###################### ==> " + ff.cursor.count());
    return ff;
});


Meteor.publish('myrejectprice', function(id: string) {

    //http://guide.meteor.com/data-loading.html
    if (!this.userId) {
        return this.ready();
    }

    return RejectPrices.find(
        {
            _id: id,
            owner: this.userId
        },
        {
            reactive: false
        }
    );
});

