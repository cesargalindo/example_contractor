import { Meteor } from 'meteor/meteor';
import { Observable } from 'rxjs/Observable';

import { ElasticParams } from '../../both/models/helper.models';
import { userNotVerified, getGlobalSize } from '../functions/functions.client.misc';

// import ApolloClient, { createNetworkInterface } from 'apollo-client';
// apollo imports
import { ApolloLink } from 'apollo-link';
import { ApolloClient } from 'apollo-client';
// import Cache from 'apollo-cache-inmemory';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';

import gql from 'graphql-tag';

let fetch = require('node-fetch');
global.fetch = fetch;

// loading npm modules
let Future = Npm.require( 'fibers/future' );
let elasticsearch = require('elasticsearch');


// // Create Apollo Client
// const networkInterface = createNetworkInterface({
//     uri: Meteor.settings.public.GRAPHQL_URL,
//     headers: {
//         'Content-type': "application/json"
//     }
// });

// let client = new ApolloClient({
//     networkInterface
// });

const client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
    // cache: new Cache()
    // cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
});

// Construct Apollo GrapQL Queries
const getItems = gql`
  query ItemsInfoQuery($serializedIds: String) {
    apItemsByIds(serializedIds: $serializedIds) {
        _id
        name
        size
        unit
        quantity
        image
    }
  }
`;

const getStores = gql`
  query StoresInfoQuery($serializedIds: String) {
    apStoresByIds(serializedIds: $serializedIds) {
        _id
        name
        address
        locationT {
            lat
            lng
        }
    }
  }
`;

const getRequestPrices = gql`
  query RequestpricesInfoQuery($ownerId: String, $status: Int, $serializedIds: String) {
    apRequestpricesbyPriceIds(ownerId: $ownerId, status: $status, serializedIds: $serializedIds) {
        _id
        priceId
    }
  }
`;


// create Elasticsearch client - DISABLE DEBUGGING
let EsClientSource = new elasticsearch.Client({
    host: Meteor.settings.ELASTICSEARCH_URL,
    log : [{
        type: 'stdio',
        levels: ['error'] // change these options
    }]
});
// enable debugging - shows each call made and the results
// let EsClientSource = new elasticsearch.Client({
//     host: Meteor.settings.ELASTICSEARCH_URL,
//     log: 'trace'
// });


Meteor.methods({

    /**
     *
     * @param searchText
     * @returns {Promise<R>|PromiseLike<TResult>}
     */
    'ss1Search'(searchText) {
        check(searchText, String);

        let query = {
                "match": {
                    "name": searchText
                }
            };

        //qq NPM has been updated to work with promises :)  - https://www.npmjs.com/package/elasticsearch
        let hits = EsClientSource.search({
            index:  Meteor.settings.ES_INDEX_ITEMS,
            type: "items",
            size: 8,
            body: {
                query: query
            }
        }).then(function (body) {

            // body.hits.hits.map(x => console.log(x._source));
            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ELASTIC SERVER ss1Search ###################### ==> " +  _.size(body.hits.hits) );

            return body.hits.hits.map(x => x._source);

        }, function (error) {
            console.trace(error.message);
        });

        console.log("########################## sever/methods_searcjh.ts -- Query: ######################## " + searchText);
        // console.log(hits);
        return hits;
    },


    /**
     * Flow #1 - Single Store search for item name
     * 1) if itemId = null and search is tied to a single store and params.limit = max
     * 2) Search elastic by name restricted to a single store - search on prices index
     * 3) When prices are returned from ES - grab all info
     * 4) make the following Apollo queries using ItemIds, storeIds, and priceIds 
     *      a) Items info
     *      b) Store info
     *      c) Requestprices info - do not cache this call
     * 
     * 
     * Flow #2 - search for item name accross many stores
     * 1) Search elastic by name with params.limit = 1 - search on prices index
     * 3) When price info is returned from ES - grab itemId
     * 4) Run another ES search on "prices" using ItemId with params.limit = max
     * 5) make the following Apollo queries using ItemId, storeIds, and priceId from 4) results
     *      a) Items info
     *      b) Store info
     *      c) Requestprices info - do not cache this call
     *         - forceFetch Apollo query ??
     *                      -- user cancelled request price  (user client)
     *                      -- user submitted a price  (another user)
     *                      -- requestPrice expired - cron runs every minute (cron server)
     *
     * Flow #3 - search for item id accross many stores
     * 1) Run ES search on "prices" using ItemId with params.limit = max
     * 2) make the following Apollo queries using ItemId, storeIds, and priceId from 1) results
     *      a) Items info
     *      b) Store info
     *      c) Requestprices info - do not cache this call
     *         - forceFetch Apollo query ??
     *                      -- user cancelled request price  (user client)
     *                      -- user submitted a price  (another user)
     *                      -- requestPrice expired - cron runs every minute (cron server)
     * 
     * 
     * TODO - replace forceFetch: true with fetchPolicy: 'cache-and-network' once we migrate to newer version of Apollo
     * http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy
     *
     * npm module has been updated to work with promises :)  - https://www.npmjs.com/package/elasticsearch
     * 
     */
    'ss2_Search'(params: ElasticParams) {

        check(params, {
            searchType: String,
            itemId: Match.OneOf(null, String),
            name: Match.OneOf(null, String),
            lat: Number,
            lng: Number,
            operator: String,
            quantity: Number,
            storeId: Match.Maybe(String),
            limit: Number,
            type: String,
            size: Number,
            unit: String,
            ss1Gunit: String,
            ss1New: Boolean
        });
        // lat = 37.2984985;
        // lng = -121.889142;

        params.limit = 7;
        let distance = '20km';

        let body = ESQueryBody(params, distance);

        // capture this.userId; - the scope for promises/observables belows appears to get screwed up access to this.userId;
        let ownerId = this.userId;

        // Create our future instance.
        let future = new Future();

        if (params.itemId == null) {

            // Single Store search is no long supported
            // FLOW #1 - Single Store search for item name 
                
            // Flow #2 - search for item name accross many stores                
            let hits = EsClientSource.search({
                index: Meteor.settings.ES_INDEX_PRICES,
                type: "prices",
                size: 1,
                body: body
            }).then(function (res) {
                if (res.hits.total) {

                    let data = res.hits.hits[0]._source;

                    // Get info for first item
                    let serializedItemIds = JSON.stringify([data.itemId]);
                    let itemsObv = new Observable.create(observer => {
                        client.query({
                            query: getItems,
                            variables: {
                                serializedIds: serializedItemIds
                            }
                        })
                        .then((results) => {
                            observer.next(_.indexBy(results.data.apItemsByIds, '_id'));
                            observer.complete();

                        }).catch((error) => {
                            console.log('there was an error sending getItems query', error);
                        });
                    });

                    // Re-rerun search with itemId provided from previous search
                    if (params.type == '2c') {
                        params.type = '2a';
                        params.itemId = data.itemId;
                    }
                    else if (params.type == '2d') {
                        params.type = '2b';
                        params.itemId = data.itemId;
                    }
                    else {
                        console.error("####### ERROR - understand this use case ... ########## - " +  data.itemId);
                        console.error("@@@@@@@ ss2_Search options is not  2c or 2c ???  @@@@@@@@ - " +  data.itemId);
                    }

                    // Re-run ESQuery - get best price info for x number of stores for same itemId
                    let body2 = ESQueryBody(params, distance);

                    let ESObv = new Observable.create(observer => {
                        EsClientSource.search({
                            index: Meteor.settings.ES_INDEX_PRICES,
                            type: "prices",
                            size: params.limit,
                            body: body2
                        }).then(function (results) {
                            let res = results.hits.hits.map(x => {
                                if (x.sort == undefined) {
                                    return ({
                                        price: x._source.id,
                                        item: x._source.itemId,
                                        store: x._source.storeId,
                                        sort: 0
                                    });
                                }
                                else {
                                    return ({
                                        price: x._source.id,
                                        item: x._source.itemId,
                                        store: x._source.storeId,
                                        sort: x.sort
                                    });
                                }

                            });

                            // Apollo Requestprices is called after prices data is returned -- there could be a long delay on client side?
                            let priceIds =  _.uniq (results.hits.hits.map(u => u._source.id) );
                            let serializedPriceIds = JSON.stringify(priceIds);
                            client.query({
                                query: getRequestPrices,
                                variables: {
                                    ownerId: ownerId,
                                    status: 1,
                                    serializedIds: serializedPriceIds
                                },
                            })
                                .then((results) => {
                                    observer.next({
                                        prices: res,
                                        requestPrices: _.indexBy(results.data.apRequestpricesbyPriceIds, 'priceId')
                                    });
                                    observer.complete();

                                }).catch((error) => {
                                console.log('there was an error sending getStores query', error);
                            });


                        }, function (error) {
                            console.error(error.message);
                            observer.next(error);
                            observer.complete();
                        });

                    });


                    // Combine item and Elasticsearch Observable
                    // Note Elasticsearch Observable contains Requestprices call as dependent sub call
                    this.combined$ = Observable.combineLatest(itemsObv, ESObv);
                    this.combined$.subscribe(x => {
                        console.log('======= itemsObv ======== ' + _.size(x[0]) );
                        console.log('======= Elasticsearch ======== ' +   _.size(x[1].prices) );
                        console.log('======= ElasticRequestpricessearch ======== ' +   _.size(x[1].requestPrices) );

                        future.return({
                            items: x[0],
                            stores: [],
                            prices: x[1].prices,
                            requestPrices: x[1].requestPrices
                        });
                    });

                }
                else {
                    future.return({
                        items: [],
                        stores: [],
                        prices: [],
                        requestPrices: []
                    });
                }

            }, function (error) {
                console.error(error.message);
                future.return({
                    items: [],
                    stores: [],
                    prices: [],
                    requestPrices: []
                });
            });
            // }

        }
        // Flow #3 - search for item id accross many stores
        else {
            let hits = EsClientSource.search({
                index: Meteor.settings.ES_INDEX_PRICES,
                type: "prices",
                size: params.limit,
                body: body
            }).then(function (results) {

                if (results.hits.total) {

                    let resPrice = results.hits.hits.map(x => {

                        if (x.sort == undefined) {
                            return ({
                                price: x._source.id,
                                item: x._source.itemId,
                                store: x._source.storeId,
                                sort: 0
                            });
                        }
                        else {
                            return ({
                                price: x._source.id,
                                item: x._source.itemId,
                                store: x._source.storeId,
                                sort: x.sort
                            });
                        }

                    });

                    // Get first item - item is the same for all entries
                    let data = results.hits.hits[0]._source;
                    let serializedItemIds = JSON.stringify([data.itemId]);
                    let itemsObv = new Observable.create(observer => {
                        client.query({
                            query: getItems,
                            variables: {
                                serializedIds: serializedItemIds
                            }
                        })
                        .then((results) => {
                            // console.warn(' RP 71 ---------- ');
                            // console.warn(results.data.apItemsByIds);

                            observer.next(_.indexBy(results.data.apItemsByIds, '_id'));
                            observer.complete();

                        }).catch((error) => {
                            console.log('there was an error sending getItems query', error);
                        });
                    });


                    let storeIds =  _.uniq (results.hits.hits.map(x => x._source.storeId) );
                    let serializedStoreIds = JSON.stringify(storeIds);
                    let storesObv = new Observable.create(observer => {
                        client.query({
                            query: getStores,
                            variables: {
                                serializedIds: serializedStoreIds
                            }
                        })
                        .then((results) => {
                            // console.warn(' RP 72 ---------- ');
                            // console.warn(results.data.apStoresByIds);

                            observer.next(_.indexBy(results.data.apStoresByIds, '_id'));
                            observer.complete();

                        }).catch((error) => {
                            console.log('there was an error sending getStores query', error);
                        });
                    });

                    let priceIds =  _.uniq (results.hits.hits.map(x => x._source.id) );
                    let serializedPriceIds = JSON.stringify(priceIds);
                    let requestPricesObv = new Observable.create(observer => {
                        client.query({
                            query: getRequestPrices,
                            fetchPolicy: 'network-only',
                            variables: {
                                ownerId: ownerId,
                                status: 1,
                                serializedIds: serializedPriceIds
                            },
                        })
                        .then((results) => {
                            // console.warn(' RP 78 ---------- ');
                            // console.warn(results.data.apRequestpricesbyPriceIds);

                            observer.next(_.indexBy(results.data.apRequestpricesbyPriceIds, 'priceId'));
                            observer.complete();

                        }).catch((error) => {
                            console.log('there was an error sending getStores query', error);
                        });
                    });

                    this.combined$ = Observable.combineLatest(itemsObv, storesObv, requestPricesObv);
                    // this.combined$ = Observable.combineLatest(itemsObv, storesObv);
                    this.combined$.subscribe(x => {
                        console.log('=-=-=-= itemsObv -=-=-=- ' + _.size(x[0]) );
                        console.log('=-=-=-= storesObv -=-=-=- ' + _.size(x[1]) );
                        console.log('=-=-=- requestPricesObv -=-=-=- ' + _.size(x[2]) );
                        future.return({
                            items: x[0],
                            stores: x[1],
                            prices: resPrice,
                            requestPrices: x[2]
                        });
                    });

                }
                else {
                    future.return({
                        items: [],
                        stores: [],
                        prices: [],
                        requestPrices: []
                    });
                }

            }, function (error) {
                console.error(error.message);
                future.return({
                    items: [],
                    stores: [],
                    prices: [],
                    requestPrices: []
                });
            });
        }


        console.log("### ss2_Search  sever/methods_search.ts -- Query: ss2_Search ### " + params.name);
        // console.log(hits);

        return future.wait();
    },



    /**
     * lat and lat are not used
     * searches are restricted to storeId
     *
     */
    'ss3_Search'(params: ElasticParams) {
        check(params, {
            searchType: Match.OneOf(null, String),
            itemId: Match.OneOf(null, String),
            storeId: String,
            name: Match.OneOf(null, String),
            lat: Number,
            lng: Number,
            operator: String,
            quantity: Number,
            limit: Match.Maybe(Number),
            type: String,
        });

        // Restrict limit if user is not verified
        if (userNotVerified()) {
            params.limit = 7;
        }

        console.error("**** ss3_Search ****: " + params.type + ' -- ' + params.name + ' -- ' + params.itemId + ' -- ' + params.storeId + ' -- ' + params.operator + ' -- ' + params.quantity);

        // filterbyName, filterbyItemId, storeOperatorFilter, quantity not required because ALL items are retrieved
        // It's possible a future rev may allow enhanced filtering??
        let quantity = parseInt(params.quantity);

        let query =  {};

        /**  3e: SingleStore, operator = all, itemId  - no GeoLocation */
        /**  3g: SingleStore, operator = all, searchTerm - no GeoLocation*/
        switch(params.type) {

            // Construct search queries for Submit landing page
            // query is restricted to one store
            // payoutRequest status must = 1
            case '3e':
                query = {
                    "bool": {
                        "filter": [
                            {
                                "term" : { "itemId" : params.itemId }
                            },
                            {
                                "term" : { "storeId": params.storeId }
                            },
                            {
                                "term" : { "payoutRequest": 1 }
                            }
                        ]
                    }
                };
                break;

            case '3g':
                // console.error('NAME ==> ' + params.name);
                if (params.name) {
                    query = {
                        "bool": {
                            "filter": [
                                {
                                    "term" : { "storeId": params.storeId }
                                },
                                {
                                    "term" : { "payoutRequest": 1 }
                                }
                            ]
                        }
                    };
                }
                else {
                    query = {
                        "bool": {
                            "filter": [
                                {
                                    "term" : { "storeId": params.storeId }
                                },
                                {
                                    "term" : { "payoutRequest": 1 }
                                }
                            ]
                        }
                    };
                }
                break;
        }

        // Create our future instance.
        let future = new Future();

        //npm module has been updated to work with promises :)  - https://www.npmjs.com/package/elasticsearch
        let hits = EsClientSource.search({
            index:  Meteor.settings.ES_INDEX_PRICES,
            type: "prices",
            size: params.limit + 1,
            body: {
                query: query
            }
        }).then(function (results) {

            console.log("=-=-=-=-=-=-=- BEGAN ss3_Search =-=-=-=-=-=-=-=-");

            if (results.hits.total) {

                let resPrice = results.hits.hits.map(x => {

                    console.log(x._source.id + ' -a- ' + x._source.itemId + ' -b- ' + x._source.storeId + ' -c- ' + x.sort + ' -d- ' + x._source.price + ' -e- ' + x._source.quantity);

                    if (x.sort == undefined) {
                        return ({
                            price: x._source.id,
                            item: x._source.itemId,
                            store: x._source.storeId,
                            sort: 0
                        });
                    }
                    else {
                        return ({
                            price: x._source.id,
                            item: x._source.itemId,
                            store: x._source.storeId,
                            sort: x.sort
                        });
                    }
                });

                let itemIds = _.uniq(results.hits.hits.map(x => x._source.itemId));
                let serializedItemIds = JSON.stringify(itemIds);
                let itemsObv = new Observable.create(observer => {
                    client.query({
                        query: getItems,
                        variables: {
                            serializedIds: serializedItemIds
                        }
                    })
                        .then((results) => {
                            // console.log(' RP 71 ---------- ');
                            // console.warn(results);
                            // console.warn(results.data.apItemsByIds);

                            observer.next(_.indexBy(results.data.apItemsByIds, '_id'));
                            observer.complete();

                        }).catch((error) => {
                        console.log('there was an error sending getItems query', error);
                    });
                });


                let storeIds = _.uniq(results.hits.hits.map(x => x._source.storeId));
                let serializedStoreIds = JSON.stringify(storeIds);
                let storesObv = new Observable.create(observer => {
                    client.query({
                        query: getStores,
                        variables: {
                            serializedIds: serializedStoreIds
                        }
                    })
                        .then((results) => {
                            // console.log(' RP 72 ---------- ');
                            // console.warn(results);
                            // console.warn(results.data.apStoresByIds);

                            observer.next(_.indexBy(results.data.apStoresByIds, '_id'));
                            observer.complete();

                        }).catch((error) => {
                        console.log('there was an error sending getStores query', error);
                    });
                });


                this.combined$ = Observable.combineLatest(itemsObv, storesObv);
                this.combined$.subscribe(x => {
                    // console.log(x);
                    console.log('=-=-=-=-=-=-=-=-=-=-00=-=-=-=-=-=-=-=-=-=-=-=-=-');
                    console.log(x[0]);
                    console.log('=-=-=-=-=-=-=-=-=-=-11=-=-=-=-=-=-=-=-=-=-=-=-=-');
                    console.log(x[1]);

                    future.return({
                        items: x[0],
                        stores: x[1],
                        prices: resPrice
                    });
                });

                console.log("=-=-=-=-=-=-=- END ss3_Search =-=-=-=-=-=-=-=-");
            }
            else {
                future.return({
                    items: [],
                    stores: [],
                    prices: []
                });
            }



        }, function (error) {
            console.error(error.message);
            future.return({
                items: [],
                stores: [],
                prices: []
            });
        });

        console.log("### ss3_Search  sever/methods_search.ts -- Query: ss3_Search ### " + params.name);
        return future.wait();
    },


});


/**
 * The latest filtering strategy "ct" ignores "quanity" field all together
 * 
 * if ss1Gunit == gunit {
 *   use as is:
 *     gunit
 *     gsize
 * }
 * else {
 *  ignore current filter settings:
 *  set gunit = ss1Gunit
 *  set radio = "All" to bypass gsize filtering
 * }
 * 
 * 2a: Stores near, operator = all, itemId
 * 2b: Stores near, operator = equal, less, more, itemId
 * 2c: Stores near, operator = all, searchTerm
 * 2d: Stores near, operator = equal, less, more, searchTerm
 *
 * 2e: SingleStore, operator = all, itemId  - no GeoLocation
 * 2f: SingleStore, operator = equal, less, more, itemId - no GeoLocation
 * 2g: SingleStore, operator = all, searchTerm - no GeoLocation
 * 2h: SingleStore, operator = equal, less, more, searchTerm - no GeoLocation
 *
 * filter by operator, gsize, and gunit when "gunit" is not equal to "ct"
 * when gunit = "ct" exclude filtering by gsize - rely on item description??
 * 
 * if filtering by itemId, there no need to filter on gunit - it's implied in the item
 * 
 * added new field ss1New, if ss1New = true, ignore filters and ss1Gunit 
 * 
 */
function ESQueryBody(params, distance) {
        let query =  {};
        let body =  {};
    
        console.log(params);

        let filterByItemId = {};        
        let filterByGsize = {};
        let filterByGunit = {};
    
        let gInfo = getGlobalSize(params.size, params.unit);
        let gunit = gInfo.gunit;
        let gsize = gInfo.gsize;

        if (params.ss1New) {
            params.operator = 'all';      
            filterByGunit =  { }      
        }
        else if (params.ss1Gunit == gunit) {
            // use gunit and gsize as is - ss1 results "selected item" matches filter settings
            filterByGunit =  { "term" : { "gunit" : gunit } }
        }
        else { 
            // override filter settings - ss1 result "selected item" doesn't match filter settings 
            // exclude gsize in search, set filter to "all"
            gunit = params.ss1Gunit;
            params.operator = 'all';
            filterByGunit =  { "term" : { "gunit" : gunit } }
        }
    
        console.log(params.size + ' -- ' + params.unit + ' -y-y-u- ' + params.ss1Gunit + ' ==y== ' + gunit + ' >> ' + params.operator);
        
        let mustMatch = [
            {
                "match": {
                    "name":  {"query": params.name, "operator": "and"}
                }
            }
        ];
        
        // no need to filter by gunit since we are filtering by itemId
        filterByItemId = { "term" : { "itemId" : params.itemId } };

        if (params.operator == 'more than') {
            filterByGsize = {
                    "range": {
                        "gsize" : {
                            "gt": gsize
                        }
                    }
                };
        }
        else if (params.operator == 'less than') {
            filterByGsize = {
                "range": {
                    "gsize" : {
                        "lt": gsize
                    }
                }
            };
        }
        else if (params.operator == 'equal to') {
            filterByGsize = { 
                "term": {"gsize": {"value": gsize}} 
            };
        } 
        else {
            // assume operator is equal to "all" - gsize is not used in "all" queries
        }

        let sort =  [
            { "price": { "order": "asc" }},
            {
                "_geo_distance" : {
                    "location" : {
                        "lat" : params.lat,
                        "lon" : params.lng
                    },
                    "order":         "asc",
                    "unit":          "km",
                    "distance_type": "plane"
                }
            }
        ];
    
        switch(params.type) {
    
            case '2a':
                query = {
                    "bool": {
                        "filter": [
                            filterByItemId,
                            {
                                "geo_distance": {
                                    "distance": distance,
                                    "location": {
                                        "lat": params.lat,
                                        "lon": params.lng
                                    }
                                }
                            }
                        ]
                    }
                };
                body = {
                    sort: sort,
                    query: query
                };
    
                break;
    
            case '2b':
                query = {
                    "bool": {
                        "filter": [
                            filterByGsize,
                            filterByItemId,
                            {
                                "geo_distance": {
                                    "distance": distance,
                                    "location": {
                                        "lat": params.lat,
                                        "lon": params.lng
                                    }
                                }
                            }
                        ]
                    }
                };
                body = {
                    sort: sort,
                    query: query
                };
                break;
    
            case '2c':
                query = {
                    "bool": {
                        "must": mustMatch,
                        "filter": [
                            filterByGunit,
                            {
                                "geo_distance": {
                                    "distance": distance,
                                    "location": {
                                        "lat": params.lat,
                                        "lon": params.lng
                                    }
                                }
                            }
                        ]
                    }
                };
                body = {
                    sort: sort,
                    query: query
                };
                break;
    
            case '2d':
                query = {
                    "bool": {
                        "must": mustMatch,
                        "filter": [
                            filterByGsize,
                            filterByGunit,
                            {
                                "geo_distance": {
                                    "distance": distance,
                                    "location": {
                                        "lat": params.lat,
                                        "lon": params.lng
                                    }
                                }
                            }
                        ]
                    }
                };
                body = {
                    sort: sort,
                    query: query
                };
                break;
    
            case '2e':
                query = {
                    "bool": {
                        "filter": [
                            filterByItemId,
                            {
                                "term" : { "storeId": params.storeId }
                            }
                        ]
                    }
                };
                body = {
                    query: query
                };
                break;
    
            case '2f':
                query = {
                    "bool": {
                        "filter": [
                            filterByGsize,
                            filterByItemId,
                            {
                                "term" : { "storeId": params.storeId }
                            }
                        ]
                    }
                };
                body = {
                    query: query
                };
                break;
    
            case '2g':
                query = {
                    "bool": {
                        "must": mustMatch,
                        "filter": [
                            filterByGunit,
                            {
                                "term" : { "storeId": params.storeId }
                            }
                        ]
                    }
                };
                body = {
                    query: query
                };
                break;
    
            case '2h':
                query = {
                    "bool": {
                        "must": mustMatch,
                        "filter": [
                            filterByGsize,
                            filterByGunit,
                            {
                                "term" : { "storeId": params.storeId }
                            }
                        ]
                    }
                };
                body = {
                    query: query
                };
                break;
    
        }
    
        return body;
    }
    
    
    
