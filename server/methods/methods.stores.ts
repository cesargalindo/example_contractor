import { Meteor } from 'meteor/meteor';

Meteor.methods({

    'getStores'(storeName: string, latStr: string, lngStr: string) {

        // Verify user of Client App is logged in
        if (this.userId) {
            // http://stackoverflow.com/questions/26346089/mongodb-server-sockets-closed-no-fix-found
            console.log("==> storeSearchName <=== " + storeName + ' -- ' + latStr + ' -- ' + lngStr);
            check(storeName, Match.OneOf(null, String));
            check(latStr, Number);
            check(lngStr, Number);

            if (storeName == null) {
                return [];
            }

            console.log("===> storenName.length = " + storeName.length );
            if (storeName.length < 2) {
                return [];
            }


            let promise = new Promise((resolve) => {

                let MongoClient = Npm.require('mongodb').MongoClient;

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('stores');

                        let searchRegEx = {'$regex': '.*' + (storeName || '') + '.*', '$options' : 'i'};

                        console.log(searchRegEx);

                        let lat = parseFloat(latStr);
                        let lon = parseFloat(lngStr);
                        let METERS_PER_MILE = 1609.34;

                        let geoSearch =  { location: { $nearSphere: { $geometry: { type: "Point", coordinates: [ lon, lat  ] }, $maxDistance: 9.5 * METERS_PER_MILE } } };

                        collection.find(
                            { $and: [{ name: searchRegEx }, geoSearch] },
                            { name: 1, address: 1, location: 1 },
                            { limit: 5 }
                        ).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });

                        console.log("successfully connected to the database");
                    }
                });
            });

            return promise.then(x => {
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER Method - getStores ###################### ==> " +  _.size(x) );
                return x;
            });

        }
        else {
            console.error('>>>>>>>>>>>>>> getStores method requires login <<<<<<<<<<<<<');
        }


    },


});