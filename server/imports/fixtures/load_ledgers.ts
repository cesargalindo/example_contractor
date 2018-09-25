import { Meteor } from 'meteor/meteor';
import { Ledgers } from '../../../both/collections/ledgers.collections';
import { Ledger } from '../../../both/models/ledger.model';


export function loadLedgers() {

    let currentDate = new Date().getTime();
    if (Ledgers.find().cursor.count() === 0) {

        Meteor.users.find().forEach( function(user) {
            console.log(user);

            let ledger = <Ledger>{};
            ledger.balance = 0;
            ledger.requests = Meteor.settings.REQUESTS.registration;
            ledger.pendingRequests = 0;
            ledger.pendingSubmits = 0;
            ledger.owner = user._id;
            ledger.updated = currentDate;
            ledger.created = currentDate;
            ledger.note = 'default insert';

            Ledgers.insert(ledger).subscribe();
        });
    }

}
