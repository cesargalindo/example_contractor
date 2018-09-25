import { Meteor } from 'meteor/meteor';

let MONGO_OPLOG_URL = Meteor.settings.MONGO_OPLOG_URL;

//TODO - delete from client - will only be used in cron server
//TODO - rework oplog code

Meteor.methods({

    'priceQueuesOplog'(priceId) {
        // http://stackoverflow.com/questions/26346089/mongodb-server-sockets-closed-no-fix-found
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find({
                        "ns": "meteor.pricequeues",
                        "o.priceId": priceId
                    }).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });

                    console.log("successfully connected to the database");
                }
            });
        });

        return promise.then(x => {
            return x;
        });
    },


    'priceQueuesOplogIds'(ids) {
        // http://stackoverflow.com/questions/26346089/mongodb-server-sockets-closed-no-fix-found
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find({
                            "ns": "meteor.pricequeues",
                            "op": "d",
                            "o._id": {$in: ids}
                        })
                        .toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });
                }
            });
        });

        return promise.then(x => x);
    },


    'pricesOplog'(priceId) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find({
                        "ns": "meteor.prices",
                        "o._id": priceId}).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });
                }
            });
        });
        return promise.then(x => x);
    },


    'pricesOplogIds'(ids) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find( {
                        "ns": "meteor.prices" ,
                        "op": { $ne: 'i' },
                        $or: [ { "o._id": { $in: ids } }, { "o2._id": { $in: ids } } ]
                    }).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });
                }
            });

        });
        return promise.then(x => x);
    },

    'requestPricesOplog'(priceId) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find({
                        "ns": "meteor.requestprices",
                        "o.priceId": priceId}).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });
                }
            });

        });
        return promise.then(x => x);
    },


    'requestPricesOplogIds'(ids) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find( {
                        "ns": "meteor.requestprices" ,
                        "op": { $ne: 'i' },
                        $or: [ { "o._id": { $in: ids } }, { "o2._id": { $in: ids } } ]
                    },
                        {sort: {timestamp: 1}}
                    ).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });
                }
            });
        });
        return promise.then(x => x);
    },


    'submitPricesOplog'(priceId) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find({
                        "ns": "meteor.submitprices",
                        "o.priceId": priceId}).toArray(function (err, results) {
                        // Let's close the db -- don't close until you receive the results...
                        db.close();
                        resolve(results);
                    });
                }
            });

        });
        return promise.then(x => x);
    },


    'submitPricesOplogIds'(ids) {
        let promise = new Promise((resolve) => {

            let MongoClient = Npm.require('mongodb').MongoClient, format = Npm.require('util').format;

            MongoClient.connect(MONGO_OPLOG_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('oplog.rs');

                    collection.find( {
                            "ns": "meteor.submitprices" ,
                            "op": { $ne: 'i' },
                            $or: [ { "o._id": { $in: ids } }, { "o2._id": { $in: ids } } ]
                        }).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });
                }
            });
        });
        return promise.then(x => x);
    }


});