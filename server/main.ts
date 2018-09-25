import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

/**
 * Import publications
 */
import './imports/publications/ledgers';
import './imports/publications/items';
import './imports/publications/stores';
import './imports/publications/prices';

// ss - DO I NEED THESE PUBLICATIONS STILL?
// import './imports/publications/submitprices';

import './imports/publications/requestprices';
import './imports/publications/issues';
import './imports/publications/pricequeus';

import './imports/slingshot/slingshot.init';

import { loadUsers } from './imports/fixtures/load_users';
// import { loadLedgers } from './imports/fixtures/load_ledgers';
import { loadIssues } from './imports/fixtures/load_issues';
import { loadPriceQueues } from './imports/fixtures/load_pricequeus';

Meteor.startup(() => {

  // code to run on server at startup
  // process.env.MOBILE_DDP_URL = 'http://127.0.0.1:3000';
  // process.env.MOBILE_ROOT_URL = 'http://127.0.0.1:3000';

  // Meteor.absoluteUrl.defaultOptions.rootUrl = 'http://localhost:3000';
  // process.env.ROOT_URL = 'http://localhost:3000';
  // process.env.MOBILE_ROOT_URL = 'http://localhost:3000';
  // process.env.MOBILE_DDP_URL = 'http://localhost:3000';
  // process.env.DDP_DEFAULT_CONNECTION_URL = 'http://localhost:3000';


  // https://themeteorchef.com/tutorials/sign-up-with-email-verification
  Accounts.emailTemplates.siteName = "ZoJab";
  Accounts.emailTemplates.from     = "ZoJab <no-reply@zojab.com>";

  // Customize email resetPassword template
  Accounts.emailTemplates.resetPassword.text = function (user, url) {
    url = url.replace('#/', '');

    return "Hello,\n\n" + "To reset your password, simply click the link below.\n\n" + url + "\n\nThanks.";
    // return "Click this link to reset your password: " + url;
  };

  // Customize email verifyEmail template
  Accounts.emailTemplates.verifyEmail = {
    subject() {
      return "[ZoJab] Verify Your Email Address";
    },
    text( user, url ) {

      let emailAddress   = user.emails[0].address,
          urlWithoutHash = url.replace( '#/', '' ),
          supportEmail   = "support@zojab.com",
          emailBody      = `To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact our support team: ${supportEmail}.`;

      return emailBody;
    }
  };


  //tt Add default settings to newly created user
  Accounts.onCreateUser((options, user) => {

    console.error("-----------------------options---------------------------------");
    console.error(options);
    console.error("-----------------------user---------------------------------");
    console.error(user.services);

    let defaultSettings = 1;

    //tt-1 check if user account is non-Facebook
    if (user.services.facebook != undefined) {

      console.error(user.services.facebook);
      console.error('EMAIL ===> ' + user.services.facebook.email);

      //tt-2 check if Facebook email already exist in system - user signed up with it previously
      let oldUser = Meteor.users.find({'emails.0.address': user.services.facebook.email}).fetch();
      console.error('======================== EXISTING USER==================');
      console.log(oldUser);

      if (oldUser.length) {
        defaultSettings = 0;

        //tt-3 Use the user ID we generated for Facebook account - copy over original Ranking, ledger Status
        user._id = oldUser[0]._id;
        user.ranking = {
          score: oldUser[0].ranking.score,
          downVotes: oldUser[0].ranking.downVotes,
          upVotes: oldUser[0].ranking.upVotes,
          thumbsUp: oldUser[0].ranking.thumbsUp,
          thumbsDown: oldUser[0].ranking.thumbsDown
        };
        user.favoriteItems = oldUser[0].settings.favoriteItems;
        user.favoriteStores = oldUser[0].settings.favoriteStores;
        user.settings = {
          payRequestDefault: oldUser[0].settings.payRequestDefault,
          payRequestMax: oldUser[0].settings.payRequestMax,
          minHoursDefault: oldUser[0].settings.minHoursDefault,
          minHoursMax: oldUser[0].settings.minHoursMax,
          quantityDefault: oldUser[0].settings.quantityDefault,
          quantityMax: oldUser[0].settings.quantityMax
        };
        user.withdrawalStatus = oldUser[0].withdrawalStatus;
        user.submitStatus = oldUser[0].submitStatus;
        user.requestStatus = oldUser[0].requestStatus;

        // tt -4 replace oldUserInfo _id with new ID
        oldUser[0]._id = 'FB__' + oldUser[0]._id;

        // tt -5 change email to invalid one - emails can not have dashes
        oldUser[0].emails[0].address = 'FB--' + oldUser[0].emails[0].address;

        // tt -6 - change username if it exist???
        if (oldUser[0].username) {
          Accounts.setUsername(userId,  'FB--' + oldUser[0].username);
          user.cellVerified = oldUser[0].cellVerified;
        }

        // tt -7 finally insert "copy" OldUser info
        let result = Meteor.users.insert(oldUser[0]);
        console.log(result);

        // tt -8 remove old user
        if (result) {
          Meteor.users.remove({_id: user._id});
        }

      }
    }

    if (defaultSettings) {
        // insert default ranking
        user.ranking = {
          score: 10,
          downVotes: 0,
          upVotes: 10,
          thumbsUp: JSON.stringify({}),
          thumbsDown: JSON.stringify({})
        };
        user.favoriteItems = JSON.stringify({});
        user.favoriteStores = JSON.stringify({});
        user.withdrawalStatus = 0;
        user.submitStatus = 1;
        user.requestStatus = 1;
        user.cellVerified = false;

        user.settings = {
          payRequestDefault: 0.10,
          payRequestMax: .50,
          minHoursDefault: 10,
          minHoursMax: 60,
          quantityDefault: 1,
          quantityMax: 64
        }
    }

    // return the new user object at the end!
    return user;
  });


  /**
   * Initialize Database
   */
  if (Meteor.users.find().count() === 0) {
    // Create Unique Index for rejectPrices
    // TODO - place this in it's own loadRejectPrices - so it doesn't run on every app reload
    // https://github.com/Urigo/angular2-meteor/issues/423
    let MONGO_URL = Meteor.settings.MONGO_URL;
    let MongoClient = Npm.require('mongodb').MongoClient;

    MongoClient.connect(MONGO_URL, function (err, db) {
      if (err) {
        throw err;
      } 
      else {

        let collection = db.collection('items');
        let res1 = collection.createIndex({name: 1, size: 1, unit: 1}, {unique: true});
        res1.then(x => {
          console.log("==> successfully created unique index for items <==");
        });

        collection = db.collection('prices');
        let res2 = collection.createIndex({storeId: 1, itemId: 1, quantity: 1}, {unique: true});
        res2.then(x => {
          console.log("==> successfully created unique index for prices <==");
        })

        collection = db.collection('rejectprices');
        let res3 = collection.createIndex({rpId: 1, spId: 1}, {unique: true});
        res3.then(x => {
          console.log("==> successfully created unique index for RejectPrices <==");
        });

        collection = db.collection('stores');
        let res4 = collection.createIndex({name: 1, address: 1}, {unique: true});
        res4.then(x => {
          console.log("==> successfully created unique index for stores <==");
        })

        // user info uniqueness is checked during user registration through server calls

        // Build GeoJSON index
        // https://github.com/Urigo/angular2-meteor/issues/423
        collection = db.collection('stores');
        let res5 = collection.createIndex({location: '2dsphere'});
        res5.then(x => {
          console.log("==> successfully created 2dsphere index for Stores <==");
        });

      }
    });

    // Add Facebook credentials to the service configuration collection in the database
    ServiceConfiguration.configurations.upsert({
      service: "facebook"
    }, {
      $set: {
        appId: Meteor.settings.facebook.appId,
        secret: Meteor.settings.facebook.secret
      }
    });


    loadUsers();
    // loadLedgers();
    loadIssues();
    loadPriceQueues();

  }
  else {
    console.error('############## SKIPPING LOAD DATA ############## ');
  }

});


