import { Component, OnInit, NgZone } from '@angular/core';
import { Router }  from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Random } from 'meteor/random';

import { Item } from "../../../../both/models/item.model";
import { Items } from "../../../../both/collections/items.collection";

import moment = require("moment/moment");

import { Issue } from "../../../../both/models/issue.model";
import { Issues } from "../../../../both/collections/issues.collection";
import { VariablesService } from '../services-global/VariablesService';
import { UserService } from '../services-global/UserService';
import { SearchHistoryService } from '../services-global/SearchHistoryService';

import { Counts } from 'meteor/tmeasday:publish-counts';

import template from './landing-page.html';

@Component({
    selector: 'landing-page',
    template,
})

export class LandingPageComponent implements OnInit {
    picFileName: string;
    upc: number;

    // combine observables
    private combined$: Observable<any[]>;
    data: Observable<Item[]>;
    subCount: Observable<any>;
    private issuesSub: Subscription;

    pageSize: number = 19;  // page size is hardcoded to 20 on server
    dateOrder: number = -1;  // dateOrder is hardcoded on servoer to -1
    p: number = 1;

    // Data pushed to template
    totalCount: number;
    dataArray: Array<any>;

    display_spinner: boolean = false;

    storeName: string = 'missing store';
    barCamObserv: Observable<Object>;
    // forceTransfer: boolean = false;

    lastPhotoObsv: Observable<Object>;
    lastPhoto: string;
    snapsTotal: number = 0;

    albums: any;

    constructor(
        public _searchHistory: SearchHistoryService,
        public _userService: UserService,                
        public _varsService: VariablesService,
        private router: Router,        
        private _ngZone: NgZone) { }


    ngOnInit() {
        this._varsService.setReactiveHideToolbar(false);
        this._varsService.setReactiveTitleName('HOME');

        let searchInfo = this._searchHistory.getHistory("photos");
        searchInfo.map(x => {
            ++this.snapsTotal;            
            console.log('----...-----...landing page...-----.....');
            console.log( JSON.stringify (x) );
        });

        this.getPageX(this.p);            
    }


    getPageX(x) {
        this.p = x;
        this.getObservables();

        // Pushed data to dataArray when both observables have fired
        this.combined$ = Observable.combineLatest(this.data, this.subCount);

        this.combined$.subscribe(x => {
            this.dataArray = x[0];
            console.log(x);
        });
    }


    getObservables() {
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        this.issuesSub = MeteorObservable.subscribe('itemsByOwner', options).zone().subscribe();

        this.subCount = new Observable.create(observer => {
            MeteorObservable.autorun().zone().subscribe(() => {
                this.totalCount = Counts.get('numberOfItems');
                console.log('--numberOfItems A-->> '+ this.totalCount);

                if (this.totalCount) {
                    console.log('--numberOfItems B-->> '+ this.totalCount);
                    observer.next(this.totalCount);
                    observer.complete();
                }

            });
        });

        this.data = Items.find({}, options);
    }


    barcodeCapture() {
        // // If Capture price = true redirect to landing2 page 
        // if (this._userService.capturePrice) {
        //     this.router.navigate(['/landing2']);    
        //     return;        
        // }

        if(Meteor.isCordova) {
            this.display_spinner = true;
            this.barCamObserv = this.launchBarcodeScanner().first();
            this.barCamObserv.subscribe(x => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (x.status) {
                        this.upc = x.upc;
                        alert('Next, please position camera to take a picture of item.');
                        this.takeDaPicture();
                    }
                    else {
                        alert(x.error);
                        this.display_spinner = false;                        
                    }
                });
            })
        }
    }


    /**
     * Wrap around an observable
     */
    launchBarcodeScanner() {
        return new Observable.create(observer => {
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    let upc = parseInt(result.text);
                    console.log('UPC = ' + result.text);
                    Meteor.call('checkIfUPCExistAlready', upc, function (err, res) { 
                        
                        if(err) {
                            let msg = 'ERROR: ' + res.name + ' -- ' + res.id + ' -- ' + res.status + ' -- ' + res.error;
                            observer.next({ status: false, error: msg});
                            observer.complete();
                        }
                        else if(res.status) {
                            observer.next({ status: false, error: 'ITEM ALREADY EXIST IN MONGO DB'});
                            observer.complete();
                        }
                        else {
                            observer.next({ status: true, upc: upc});
                            observer.complete();
                        }
                    });
                }, 
                function (error) {
                    observer.next({ status: false, error: "Scanning failed: " + error});
                    observer.complete();
                }
            );

        });
    }


    /**
     * Take picture using custom package meteor add ccmdg:camera
     */
    takeDaPicture() {
        this.picFileName = Random.id(17) + '_upc.png';                             
        
        // Alows for contractors to vary picture quality
        let options = {};
        let iqual = 95;
        if (this._userService.pictureQuality != undefined) {
            iqual = this._userService.pictureQuality
        }
        
        options = {
            quality: iqual,
        }

        CCMeteorCamera.getPicture(options, (error, res) => {
            if (error) {
                this._ngZone.run(() => { // run inside Angular2 world                                    
                    console.log('!!!!!!!!!!!!! Failed to fs log ${error}');
                    console.log(error);
                    this.display_spinner = false;
                });                    
            }
            else {
                // place global this into a local variable that is accessible within scope of this function
                let captureThis1 = this;

                // save image info to local history
                this.lastPhotoObsv = this.getDaLastPhoto().first();
                this.lastPhotoObsv.subscribe(x => {

                    if (x.status) {
                        this.picFileName = Random.id(17) + '_upc.png';
                        let id = this.insertHistory();
                        this.addItemBarcode();
                    }
                    else {
                        alert('GOT ERROR ON getDaLastPhoto()...');
                    }

                });
            }
        });
    }

    // #####################################################################################

    getDaLastPhoto() {
        return new Observable.create(observer => {
            if ( device.platform == "Android" ) {
                this.getDaLastPhoto_android(observer);
            }
            else {
                this.getDaLastPhoto_ios(observer);
            }
        });
    }


    /**
     * Retrieve a listing of photos in your gallery "Camera roll"
     * Photos.photos is quite buggy on Android, use photoLibrary.getLibrary instead
     * 
     * @param observer 
     */
    getDaLastPhoto_android(observer) {
        if (Meteor.isCordova) {
            let cnt = 0;
            let cpThisZ = this;

            cordova.plugins.photoLibrary.getLibrary(
                function (result) {
                    var library = result.library;
                
                    // Here we have the library as array
                    library.forEach(function(libraryItem) {

                        if (cnt == 0) {
                            // console.log(libraryItem.id);          // ID of the photo
                            // console.log(libraryItem.photoURL);    // Cross-platform access to photo
                            // console.log(libraryItem.thumbnailURL);// Cross-platform access to thumbnail
                            // console.log(libraryItem.fileName);
                            // console.log(libraryItem.width);
                            // console.log(libraryItem.height);
                            // console.log(libraryItem.creationDate);
                            // console.log(libraryItem.latitude);
                            // console.log(libraryItem.longitude);
                            // console.log(libraryItem.albumIds);    // array of ids of appropriate AlbumItem, only of includeAlbumsData was used

                            let photoId = libraryItem.id.split(";");
                            console.log("CNT = " + cnt + ' photoId = ' + photoId[0] + ' -- ' + libraryItem.id );
                            
                            cpThisZ.assignLastPhoto(photoId[0])
                            observer.next({ status: true});
                            observer.complete();
                        }

                        cnt++;
                    });
            
                },
                function (err) {
                console.log('Error occured');
                },
                { 
                    // optional options
                    includeAlbumData: false
                }
            );

        }
        else {
            observer.next({ status: false, error: "Cordova only app logic "});
            observer.complete();
        }
    }


    /**
     * Retrieve a listing of photos in your gallery "Camera roll"
     * Photos.photos is quite buggy on Android, only use for iOS
     * 
     */
    getDaLastPhoto_ios(observer) {
        if (Meteor.isCordova) {
            // Get all photos from albums "XXXXXX" and "YYYYYY" 
            var bundleSize = 1;
            var bundle = 0;
            let cap1 = this;

            Photos.photos([],
                {"limit": bundleSize},
                function(photos) {
                    // We need only 1 bundles, so let's stop fetching 
                    // This code will be called several times  
                    Photos.cancel();

                    if (bundle == 0) {
                        console.log("Bundle #" + bundle + ": " + JSON.stringify(photos) + " -- " + photos[0].name );
                        cap1.assignLastPhoto(photos[0].name)

                        observer.next({ status: true});
                        observer.complete();
                    }
                    ++bundle;                    
                }, 
                console.error('Unable to retrive latest photo')
            );

        }
        else {
            observer.next({ status: false, error: "Cordova only app logic " });
            observer.complete();
        }
    }


    insertHistory() {
        ++this.snapsTotal;            
        
        this._searchHistory.addItem("photos", {
            created: new Date().getTime(),
            imageName: this.lastPhoto,
            newImageName: this.picFileName
        })
    }


    assignLastPhoto(photo) {
        this.lastPhoto = photo;
    }


    addItemBarcode() {
        Meteor.call('barcodeSearch', this.upc, this.picFileName, '', 0, 0,  function (err2, res2) { 
            if(err2) {
                alert('ERROR: ' + res2.name + ' -- ' + res2.id + ' -- ' + res2.status + ' -- ' + res2.error );
            }
            if(res2.status) {
                console.log('SUCESS: ' + res2.name + ' #### ' + res2.id + ' #### ' + res2.status + ' -- ' + res2.error );
            }
            else {
                console.log('SUCESS: PIC SAVED');
            }
        });

        this.display_spinner = false;
    }


    ngOnDestroy() {
        if (this.issuesSub != undefined) {
            this.issuesSub.unsubscribe();
        }
    }





}
