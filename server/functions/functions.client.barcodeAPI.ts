/**
 * http://www.upcitemdb.com/wp/docs/main/development/getting-started/
 *
 */
const https = require('https')


/**
 * 
 * @param barcode 
 * @param cb 
 */
export function upcitemdb_upcSearch(barcode, cb) {
  // barcode = 4002293401102;

  var opts = {
    hostname: 'api.upcitemdb.com',
    path: '/prod/v1/lookup',
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "user_key": Meteor.settings.upcitemdb.user_key,
      "key_type": "3scale"
    }
  }
  var req = https.request(opts, function(res) {
    console.log('statusCode: ', res.statusCode);
    console.log('headers: ', res.headers);
    res.on('data', function(d) {
      // console.log('BODY: ' + d);
      cb(null, d);
    })
  })
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    cb(e, null);    
  })
  
  // req.write('{ "upc": "4002293401102" }')
  req.write('{ "upc": "' + barcode + '" }')
  
  // other requests
  req.end()

}



/*
* Simple test script to showcase use of semantics3-node to interface
* with Semantics3 Products API.
* 
* Quickstart guide: https://semantics3.com/quickstart
* API Documentation: https://semantics3.com/docs
*
* Author: Sivamani VARUN <varun@semantics3.com>
* Copyright (c) 2013 Semantics3 Inc.
*
* The MIT License from http://www.opensource.org/licenses/mit-license.php
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

// //Register for your access credentials at https://semantics3.com
// var sem3 = require('./functions.client.semantic.ts')(Meteor.settings.semantic3.api_key, Meteor.settings.semantic3.secret);

// /*
//  Sample query for retrieving products using Semantics3 Products API:
 
//  The sample query shown below returns Toshiba branded products, belonging to the electronics category (ID 13658), that weigh >=1.0kg and <1.5kg (1500000 mg) and have retailed recently on the website newegg.com for >=USD 100, sorted in descending order of product name, limited to 5 results. 
// */

// // Build the query
// export function upcSearch(barcode, cb) {
//   sem3.products.products_field( "upc", barcode );
//   sem3.products.products_field( "field", ["name","gtins"] );
//   sem3.products.products_field( "offset", 1 );
  
  
//   // Run the request
//   sem3.products.get_products(
//      function(err, products) {
//         if (err) {
//            console.log("------------------------------------Couldn't execute request: get_products");
//            cb(err, null);
//            return;
//         }
//         // console.log(JSON.stringify(products));
//         // View the results of the request
//         cb(null, products);
//      }
//   );

// }

