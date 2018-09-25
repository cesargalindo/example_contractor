import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone }   from '@angular/core';
import { Router }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../../services-global/UserService';
import { VariablesService } from '../../services-global/VariablesService';
import { SearchHistoryService } from '../../services-global/SearchHistoryService';

import template from './contractor-settings.html';
import { stringify } from 'querystring';

/**
 * User variable used by Constructor
 * 
 * Allow picture quality to be set using this.picQualityDefault 
 * this.picQualityDefault = (a value from 50 to 100)
 * 
 */
@Component({
    selector: 'contractor-settings',
    template,
})
export class ContractorSettingsComponent implements OnInit {
    user: Meteor.User;
    sliderSettingsForm: FormGroup;

    list: Object;
    display_spinner: boolean = false;
    spinnerValue: number = 0;
    error: string;
    successMsg: string = '';

    picQualityDefault: number;
    qualityVal: number;
    
    selectLocation: string = 'Select Location';

    snapArrayName = {};
    snapCount: number;
    snapsTotal: number;

    constructor(
        public _searchHistory: SearchHistoryService,
        private router: Router,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        public _userService: UserService) { }


    ngOnInit() {
        // If this page is reloaded, redirect to home page to allow user credentials to load
        if (this._userService.cellVerified == undefined) {
            this.router.navigate(['/landing']);
            return;
        }

        this.sliderSettingsForm = this.formBuilder.group({
            qualityValue: [''],
            barcode: [']']
        });


        // ensure minimum value is set to 50        
        if (this._userService.pictureQuality == undefined) {
            this.qualityVal = 95;            
        }
        else if (this._userService.pictureQuality < 50) {
            this.qualityVal = 95;                        
        }
        else {
            this.qualityVal = this._userService.pictureQuality;            
        }
        this.picQualityDefault = this.qualityVal;

        this.snapCount = 0;
        this.snapsTotal = 0;     

        let searchInfo = this._searchHistory.getHistory("photos");
        searchInfo.map(x => {
            ++this.snapsTotal;            
            this.snapArrayName[x.imageName] = x.newImageName;
        })

    }


    /**
     * Hide top toolbar to allow buttons to be shown on top
     */
    ngAfterContentChecked() {
        this._varsService.setReactiveHideToolbar(true);
    }


    picQualitySlider(event) {
        console.log(event.value);
        this.qualityVal = event.value;
    }


    saveSettingsInfo() {
        this.successMsg = '';
        this.display_spinner = true;

        // Update user profile settings info
        Meteor.call('updateContractorUserSettings', this.qualityVal, false, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (res.status) {
                    if (error) {
                        this.error = error;
                        this.display_spinner = false;
                    }
                    else {
                        // Force reload of UserProfile info
                        this._userService.initializeUserInfo(true);

                        let cpThis = this;

                        // delay for 1.0 second to give time for user profile to reload - before user visits another page
                        Meteor.setTimeout(function () {
                            cpThis.display_spinner = false;
                            cpThis.successMsg = 'Picture settings successfully updated.';
                        }, 1000);

                    }
                }
                else {
                    this.error = res.error;
                    this.display_spinner = false;
                }
            });
        });
    }

    uploadPictures() {
        if ( device.platform == "Android" ) {
            this.uploadPictures_android();
        }
        else {
            this.uploadPictures_ios();
        }
    }

    /**
     * Upload the picture to Cloud
     */
    uploadPictures_ios() {

        if (Meteor.isCordova) {
            
            if (navigator.connection.type != 'wifi') {
                alert('WIFI connection required to upload pictures.')
                return;
            }

            this.display_spinner = true;            
            let cap1 = this;
            let timeout = 0;

            Photos.photos( 
                function(photos) {
                    photos.map(x => {
                        if (cap1.snapArrayName[x.name]) {
                            console.log(cap1.snapArrayName[x.name] + ' -ff- ' + x.name);
                                            
                            Meteor.setTimeout(function () {
                                cap1.getPhotosThumbNail(x.id, cap1.snapArrayName[x.name]);
                            }, timeout);

                            timeout = timeout + 400;
                        }
                    })
                },
                function(error) {
                    console.error("Error: " + error);
                }
            );
        }
        else {
            alert("Cordova required.");
        }
    }

    
    /**
     * Upload the picture to Cloud
     */
    uploadPictures_android() {

        if (Meteor.isCordova) {
            
            if (navigator.connection.type != 'wifi') {
                alert('WIFI connection required to upload pictures.')
                return;
            }

            this.display_spinner = true;            
            let cap1 = this;
            let timeout = 0;

            cordova.plugins.photoLibrary.getLibrary(
                function (result) {
                  var library = result.library;
                  // Here we have the library as array
              
                  library.forEach(function(libraryItem) {
                    let photoId = libraryItem.id.split(";");

                    if (cap1.snapArrayName[photoId[0]]) {
                        console.log(cap1.snapArrayName[photoId[0]] + ' -ff- ' + libraryItem.id + ' -- ' + photoId[0]);
                                        
                        Meteor.setTimeout(function () {
                            cap1.getPhotosThumbNail(photoId[0], cap1.snapArrayName[photoId[0]]);
                        }, timeout);

                        timeout = timeout + 400;
                    }
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
            alert("Cordova required.");
        }
    }

    /**
     * 
     * @param id 
     * @param filename 
     */
    getPhotosThumbNail(id, filename) {
        this._ngZone.run(() => { // run inside Angular2 world
            ++this.snapCount;
            this.spinnerValue = Math.round( 100 * this.snapCount / this.snapsTotal );
        });

        if ( (id == undefined) || (filename == undefined) ) {
            return;
        }
        
        let captureThis1 = this;

        // Generate a thumbnail of photo with ID "XXXXXX" as data URL
        // with maximal dimension by width or height of 600 pixels
        // and JPEG quality of 95:
        Photos.thumbnail(id,
        {"asDataUrl": true, "dimension": 600, "quality": 95},
        function(data) {
            let leFile = CCMeteorCamera.dataURItoFile(data, filename);
            let uploader = new Slingshot.Upload("myFileUploads");

            uploader.send(leFile, Meteor.bindEnvironment(function(error, downloadUrl) {
                if (error) {
                    // Log service detailed response.
                    captureThis1.error = error;  
                    console.error( JSON.stringify( error) );
                }
                else {
                    console.log(" upload url == " + downloadUrl + '  filename = ' + filename);
                    captureThis1._searchHistory.removeItem("photos", {
                        newImageName: filename
                    })
                }
            }));


        },
        function(error) {
            console.error("Error - getPhotosThumbNail: " + error);
        });

    }


    checkConnection() {
        if (Meteor.isCordova) {
            alert(navigator.connection.type + ' -- ' + Connection.WIFI);
        }
    }


    checkBarcode() {
        if (this.sliderSettingsForm.value.barcode > 1000000) {
            Meteor.call('checkIfUPCExistAlready', this.sliderSettingsForm.value.barcode, function (err, res) { 
                if(err) {
                    alert('ERROR: ' + res.name + ' -- ' + res.id + ' -- ' + res.status + ' -- ' + res.error);
                }
                else if(res.status) {
                    alert('STATUS: ' + 'UPC NUMBER ALREADY EXIST IN MONGO DB');
                }
                else {
                    alert('STATUS: ' + 'THIS UPC DOES NOT EXIST IN MONGO DB');
                }
            });
        }
        else {
            alert ('Enter a valid upc number.');
        }
    }

}
