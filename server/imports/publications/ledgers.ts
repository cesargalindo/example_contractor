import { Meteor } from 'meteor/meteor';
import { Ledgers } from '../../../both/collections/ledgers.collections';


Meteor.publish('mybalance', function() {

    //http://guide.meteor.com/data-loading.html
    if (!this.userId) {
        return this.ready();
    }

    // mongodb field restriction doesn't work
    let ff = Ledgers.find(
        { owner: this.userId },
        { balance: 1, requests: 1 }
    );

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER mybalance  ###################### " + ff.cursor.count() );
    return ff;
});

