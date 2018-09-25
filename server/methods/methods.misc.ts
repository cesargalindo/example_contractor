import { Meteor } from 'meteor/meteor';


Meteor.methods({

    /**
     *  check if AWS image is available
     *
     */
    'checkValidImage'(link1: string) {
        check(link1, String);

        if (this.userId) {
            try {
                HTTP.call('GET', link1, {});
                console.log('SUCCESS AWS IMAGE EXIST... ' + link1);
                return true;
            }
            catch (err) {
                // console.log(err);
                return false;
            }
        }
    }


});