# ZoJab Angular2-Meteor-Base App - Contractor Version

## Usage

Update settings-default.json file with appropriate information "keys, urls, etc."

> meteor --settings settings-default.json --port 3000

To debug on server side:

> meteor --settings settings-default.json --port 3000 debug

Please note: by default, settings are available on server only. Settings values that will be used in client code must go inside the "public" block of your settings.json and can be accessed via Meteor.settings.public.KEY_NAME
See: http://stackoverflow.com/questions/15559743/meteor-client-side-settings


## Run locally, test remotely from any device (HTTP and HTTPS)

Start the app locally as described above, and verify that you can access it via localhost.

Then, open a terminal window and create a tunnel using ngrok:

> ./ngrok http 3000

The output from this command will consist of 2 URLs that forward requests to your local server, over HTTP and HTTPS. Works even if your local box is behind a firewall.


## Contents

This package contains:

- TypeScript support and Angular 2 compilers for Meteor
- Angular2-Meteor
- Angular2 (core, common, compiler, platform)
- Angular2 Material, SASS support
- Apollo GraphQL client side (requires Apollo Server)
- Testing framework with Mocha and Chai
- Meteor packages:  
    >  meteor list   
- NPM Packages:  
    > npm list
- ....

## Folder Structure

The folder structure is a mix between [Angular 2 recommendation](https://johnpapa.net/angular-2-styles/) and [Meteor recommendation](https://guide.meteor.com/structure.html).



#### Client

The `client` folder contains single TypeScript (`.ts`) file which is the main file (`/client/app.component.ts`), and bootstrap's the Angular 2 application.

The main component uses HTML template and SASS file.

The `index.html` file is the main HTML which loads the application by using the main component selector (`<app>`).

All the other client files are under `client/imports` and organized by the context of the components.


#### Server

The `server` folder contain single TypeScript (`.ts`) file which is the main file (`/server/main.ts`), and creates the main server instance, and the starts it.

All other server files should be located under `/server/imports`.

#### Common 

Example for common files in our app, is the MongoDB collection we create - it located under `/both` and it can be imported from both client and server code.

#### private

Contents in private directory is only accessible to server code

#### public

Contents in public directory is accessible to client 

## TODO - testing with Mocha in progress

The testing environment in this boilerplate based on [Meteor recommendation](https://guide.meteor.com/testing.html), and uses Mocha as testing framework along with Chai for assertion.

There is a main test file that initialize Angular 2 tests library, it located under `/client/init.test.ts`.

All other test files are located near the component/service it tests, with the `.test.ts` extension.


## To fixe @agm/core bug
Add following to package.json in agm/core:
"main": "core.umd.js"