import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { Observable } from "rxjs/Observable";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Item } from '../../../../../both/models/item.model';
import { VariablesService } from '../../services-global/VariablesService';
import { ValidatorsService } from '../../services/ValidatorService';
import { SingleCollectionService } from '../../services/SingleIdCollection.data.service';
import { CacheStateService } from '../../services-global/CacheStateService';
import { SnackbarService } from '../../services/SnackbarService';
import { UserService } from '../../services-global/UserService';

import { Random } from 'meteor/random';
import template from './new-item.html';
import style from "./new-item.scss";

/**
 * Save custom address only when user clicks or hits enter key on a provided Google Place
 * update placeholder string with new custom address value
 *
 * Uses my custom geolocation Meteor package  -- http://www.webtempest.com/meteor-js-packages-tutorial
 *
 */
@Component({
    selector: 'new-item',
    template,
    styles: [ style ]
})
export class NewItemComponent implements OnInit {
    requestNewItemForm: FormGroup;

    aws_image_path: string;
    aws_image_path_thumb: string;

    thumb_image: string;
    thumb_spinner: boolean = false;

    no_image_thumb: string;
    display_spinner: boolean = false;

    editing: boolean = false;

    itemInfo: Item;
    dataItem: Observable<Item[]>;

    itemId: string;

    labels: Object;
    errors: Object;
    msgs: Object;

    unitsList = [
        { value: '-c-', viewValue: '___COUNT___' },
        { value: 'ct', viewValue: 'count (ct)' },
        { value: '-w-', viewValue: '___WEIGHT___' },
        { value: 'kg', viewValue: 'kilograms (kg)' },
        { value: 'lb', viewValue: 'pounds (lb)' },
        { value: 'oz', viewValue: 'ounces (oz)' },
        { value: 'gm', viewValue: 'grams (gm)' },
        { value: '-v-', viewValue: '___VOLUME___' },
        { value: 'gal', viewValue: 'gallons (gal)' },
        { value: 'lt', viewValue: 'liters (lt)' },
        { value: 'qt', viewValue: 'quarts (qt)' },
        { value: 'pt', viewValue: 'pints (pt)' },
        { value: 'fl oz', viewValue: 'fl ounces (fl oz)' },        
        { value: 'ml', viewValue: 'milliliters (ml)' },
    ];
    ctSelected: boolean;

    constructor(
        public _snackbar: SnackbarService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        private _validatorsService: ValidatorsService,
        public _userService: UserService,
        public _data: SingleCollectionService,
        private _cacheState: CacheStateService) { }

    ngOnInit() {
        // Check if user has access
        this._snackbar.verifyUserAccess(true);

        // create activity after page has loaded to force call to ngAfterViewInit()
        let tmpObv = new Observable(observer => {
            setTimeout(() => {
                observer.next(4);
            }, 10);
        }).first();
        tmpObv.subscribe();

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this.display_spinner = false;
                    this._snackbar.displaySnackbar(1);
                }
            });
        });

        this.aws_image_path = Meteor.settings.public.AWS_IMAGE_PATH + Meteor.settings.public.AWS_IMAGE_DEFAULT;
        this.aws_image_path_thumb =  Meteor.settings.public.AWS_IMAGE_PATH + Meteor.settings.public.AWS_IMAGE_THUMB;
        this.thumb_spinner = false;
        this.no_image_thumb = Meteor.settings.public.GOOGLE_IMAGE_PATH  + Meteor.settings.public.GOOGLE_IMAGE_THUMB + 'no/' + Meteor.settings.public.GOOGLE_NO_IMAGE;

        this._varsService.resetFormErrorVairables();
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.requestNewItemForm = this.formBuilder.group({
            itemImage: [''],
            itemSize: [''],
            itemUnit: ['oz', Validators.required],
            itemName: ['', this._validatorsService.isValidItemName ],
        });

        this.ctSelected = false;

        // Update form with values if editing
        this.route.params.subscribe((params) => {
            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^ " + params['itemId']);

            // Edit existing Requestprice
            if (params['itemId']) {
                this.itemId = params['itemId'];
                this.editing = true;

                this.dataItem = this._data.getItem(params['itemId']).zone();
                this.dataItem.subscribe(x => {

                    console.log(x);
                    this.itemInfo = x[0];
                    console.log(this.itemInfo);

                    this.requestNewItemForm.patchValue({
                        itemName: x[0].name,
                        itemSize: x[0].size,
                        itemUnit: x[0].unit,
                        itemImage: x[0].image,
                    });

                    if (x[0].image) {
                        console.log(x[0].image.includes("amazonaws"));
                        if ( x[0].image.includes("amazonaws") ) {
                            // image is on AWS - change to thumb path
                            this.thumb_image = x[0].image.replace( Meteor.settings.public.AWS_IMAGE_DEFAULT, Meteor.settings.public.AWS_IMAGE_THUMB);
                        }
                        else {
                            // then it's on Google - change to thumb path
                            this.thumb_image = x[0].image.replace( Meteor.settings.public.GOOGLE_IMAGE_DEFAULT, Meteor.settings.public.GOOGLE_IMAGE_THUMB);
                        }
                    }
                    else {
                        this.thumb_image = this.no_image_thumb;
                    }
                });
            }

        });
    }


    /**
     * Hide top toolbar to allow buttons to be shown on top
     */
    ngAfterViewInit() {
        this._varsService.setReactiveHideToolbar(true);
    }


    onChangeUnits(unit) {
        this._ngZone.run(() => { // run inside Angular2 world
            if (unit == '-c-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'ct'
                });
                this.ctSelected = true;
            }
            else if (unit == 'ct') {
                this.ctSelected = true;                
            }            
            else if (unit == '-w-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'oz'
                });
                this.ctSelected = false;
            }
            else if (unit == '-v-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'gal'
                });
                this.ctSelected = false;
            }
            else {
                this.ctSelected = false;
            }
        });
    }

    /**
     *
     * 1) Add new Item
     *
     */
    addNewRequestPrice() {

        if (this.editing) {
            this.editNewRequestPrice();
            return;
        }

        if (this.requestNewItemForm.valid) {

            this.display_spinner = true;
            this.errors['error'] = '';

            this._snackbar.resetSnackbar();

            let i = <Item>{};
            i.name = this.requestNewItemForm.value.itemName;
            i.image = this.requestNewItemForm.value.itemImage;
            i.unit = this.requestNewItemForm.value.itemUnit;

            if (i.unit == 'ct') {
                i.size = 1;
            }
            else {
                i.size = parseFloat(this.requestNewItemForm.value.itemSize);
            }

            Meteor.call('items.insert.byUser', i, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;

                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: items.insert.byUser..... !!!!!!!!!");
                        console.error(err);
                        this._varsService.setReactiveError();
                        this.errors['error'] =  err;
                        return;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: items.insert.byUser ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this.errors['error'] = res.error;
                            this._varsService.setReactiveError();
                            return;
                        }
                        else {
                            console.warn("SUCCESSFULLY INSERTED NEW items.insert.byUser... " + res.status);
                            console.warn(res);
                            this._cacheState.apolloRefetchCacheDel(['rq-active']);
                            this.router.navigate(['/item-confirmed', { itemId: res.id, storeInfo: JSON.stringify(res.storeInfo)}]);
                        }
                    }
                });
            });
        }
        else {
            // Process Form Errors
            let validateFields = {};
            validateFields['itemName'] = 1;

            this.errors = this._varsService.processFormControlErrors(this.requestNewItemForm.controls, validateFields);

            // Stay on page if we have an error - false = error
            return;
        }

    }


    /**
     * Edit existing Item
     *
     * 1) Edit new Item
     *
     */
    editNewRequestPrice() {

        if (this.requestNewItemForm.valid) {
            this.display_spinner = true;
            this._snackbar.resetSnackbar();

            let i = <Item>{};
            i._id = this.itemId;
            i.name = this.requestNewItemForm.value.itemName;
            i.unit = this.requestNewItemForm.value.itemUnit;
            i.image = this.requestNewItemForm.value.itemImage;
            
            if (i.unit == 'ct') {
                i.size = 1;
            }
            else {
                i.size = parseFloat(this.requestNewItemForm.value.itemSize);
            }

            Meteor.call('items.update.byUser', i, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON RequestPrice update in editNewRequestPrice..... !!!!!!!!!");
                        console.error(err);
                        this._varsService.setReactiveError();
                        return;
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: RequestPrices.update ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this._varsService.setReactiveError();
                            return;
                        } else {
                            // success!
                            console.log("SUCCESSFULLY UPDATED NEW PRICE REQUEST... ");
                            this._cacheState.apolloRefetchCacheDel(['rq-active']);
                            this.router.navigate(['/items-submitted']);
                        }
                    }
                });                    
                this.display_spinner = false;
            });

        }
        else {
            // Process Form Errors
            let validateFields = {};
            validateFields['itemName'] = 1;

            this.errors = this._varsService.processFormControlErrors(this.requestNewItemForm.controls, validateFields);
            // Stay on page if we have an error - false = error
            return;
        }

    }



    /**
     * upload file by selecting through browser choose file option
     *
     * @param event
     */
    onChange(event) {
        let files = event.srcElement.files;
        this.thumb_spinner = true;

        let uploader = new Slingshot.Upload("myFileUploads");
        let captureThis = this;

        uploader.send(files[0], function (error, downloadUrl) {
            if (error) {
                // Log service detailed response.
                console.error('Error uploading', uploader.xhr.response);
                alert (error);
            }
            else {
                captureThis.updateImageParamsDelayed(files[0].name);
            }
        });

    }


    /**
     * Take picture using custom package meteor add cgmdg:camera
     */
    takeDaPicture() {
        CCMeteorCamera.getPicture({}, (error, res) => {
            if (error) {
                console.log('!!!!!!!!!!!!! Failed to fs log ${error}');
                console.log(error);
            }
            else {
                console.log('==== GOT PHOTO ====');
                let uploader = new Slingshot.Upload("myFileUploads");

                let fileName = 'pic_' + Random.id(17) + '.png';
                this._ngZone.run(() => { // run inside Angular2 world
                    this.thumb_spinner = true;
                });

                var imageFile =  CCMeteorCamera.dataURItoFile(res, fileName);

                // place global this into a local variable that is accessible within scope of this function
                let captureThis = this;

                uploader.send(imageFile, function (error, downloadUrl) {
                    if (error) {
                        // Log service detailed response.
                        console.error('Error uploading', uploader.xhr.response);
                        alert (error);
                    }
                    else {
                        console.log(" upload url == " + downloadUrl);
                        captureThis.updateImageParamsDelayed(fileName);
                    }
                });

            }
        });
    }


    updateImageParamsDelayed(fileName) {
        // place global this into a local variable that is accessible within scope of this function
        let captureThis2 = this;

        var myInterval = Meteor.setInterval(function () {

            console.log("debug -----  1.2 second delayed -- filename -- " +  captureThis2.aws_image_path_thumb + ' -- ' + fileName);

            Meteor.call('checkValidImage', captureThis2.aws_image_path_thumb + fileName, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log(res);
                    if (res) {
                        Meteor.clearInterval(myInterval);
                        captureThis2.updateImageParams(fileName);
                    }
                }
            });
        }, 1200);
    }


    updateImageParams(fileName) {
        this._ngZone.run(() => { // run inside Angular2 world
            // thumb image only found on AWS - currently
            this.thumb_image = this.aws_image_path_thumb + fileName;
            this.thumb_spinner = false;

        });
        this.requestNewItemForm.patchValue({ itemImage: this.aws_image_path + fileName });
    }

}

