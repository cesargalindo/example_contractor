import { Meteor } from 'meteor/meteor';
import { PriceQueues } from '../../../both/collections/pricequeues.collection';

Meteor.publish('pricequeues', function() {
    return PriceQueues.find();
});


