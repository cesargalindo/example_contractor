import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';

/**
 * Angular 2 Injectables
 * http://jbavari.github.io/blog/2015/10/19/angular-2-injectables/
 */
@Injectable()
export class VariablesService {
    labels: Object;
    errors: Object;
    msgs: Object;
    styles: Object;

    selectedPriceId: string;
    selectedItemId: string;
    
    // Reactive Variables
    reactiveError: Subject<boolean> = new Subject<boolean>();
    reactiveSubmit: Subject<boolean> = new Subject<boolean>();
    reactiveHideToolbarVal: Subject<boolean> = new Subject<boolean>();
    reactiveTitleName: Subject<boolean> = new Subject<boolean>();

    initializeGlobalVariables() {

        this.reactiveHideToolbarVal.next(false);

        this.labels = {};
        // this.labels['size_3'] = 'Examples: 1 each, 18.8 oz, 1 lb, 2.5 lbs, XL, Medium, Gold package, 1 gallon, Basic package, ...';
        this.labels['name_5'] = 'Name (include brand manufacture, name, description ...)';
        this.labels['price_7'] = 'Price';
        this.labels['sold_out_8'] = 'Sold Out';

        this.labels['firstname'] = 'First Name';
        this.labels['lastname'] = 'Last Name';
        this.labels['deposit'] = 'Amount to deposit';

        this.msgs = {};
        // this.msgs['soldOut'] = 'Check box if out of stock or not sold at this store';
        // this.msgs['price'] = 'Enter the latest price of this item or service';
        // this.msgs['quantity'] = 'Move slider to select quantity. Example: if you want the price for 3 gallons of milk, quantity should equal 3.';
        // this.msgs['payRequest'] = 'Move slider to select amount you will pay to get the latest price on this item or service.';

        // Error messages
        this.msgs['payRequest_isOverBalance1'] = 'The total amount of $';
        this.msgs['payRequest_isOverBalance2'] = ' exceeds your balance of $';
        this.msgs['payRequest_isOverBalance3'] = '.  Please reduce amount to pay or number of stores.';
        this.msgs['payRequest_isOverBalance'] = 'CUSTOMIZE-REPLACE';

        this.msgs['itemName_isMinLength'] = 'Name must be a string greater than 10 characters';

        this.msgs['price_isNumberic'] = 'Price must be a valid number';
        this.msgs['price_minMax'] = 'Price must be greater than $0.00 and less than $10,000';

        this.msgs['price_reject'] = 'Please enter a new price or check Sold Out to reject submitted price.';

        this.msgs['required'] = ' is required.';
        this.msgs['deposit_large'] = 'Note, any amount greater than $50.00 will require two days to process before funds are available to use.';

        this.msgs['max_store_error'] = 'The maximum number of stores allowed to submit per request is 5';

        // Dynamic UX / styling
        this.styles = {
            selectedListItem: {'background-color': 'yellow'},
            mapPointIcon: '/img/map_point.png',
            myLocationIcon: '/img/my_location.png'
        }

        this.resetFormErrorVairables();
    }


    resetFormErrorVairables() {
        this.errors = {};
        this.errors['error'] = '';
        this.errors['success'] = '';

        this.errors['payRequest_isOverBalance'] = false;

        this.errors['itemName_isMinLength'] = false;

        this.errors['price_isNumberic'] = false;
        this.errors['price_minMax'] = false;
    }


    /**
     *
     * Process Form Validations Errors
     *
     */
    processFormControlErrors(formControlErrors, validateFields) {

        if (validateFields.itemName) {
            if (formControlErrors.itemName._status == 'INVALID') {
                this.errors['itemName_isMinLength'] = true;
            }
            else {
                this.errors['itemName_isMinLength'] = false;
            }
        }

        if (validateFields.price) {
            if (formControlErrors.price._status == 'INVALID') {

                if (formControlErrors.price.errors.isNumeric) {
                    this.errors['price_isNumberic'] = true;
                    this.errors['price_minMax'] = false;
                } else {
                    this.errors['price_isNumberic'] = false;
                    this.errors['price_minMax'] = true;
                }
            }
            else {
                this.errors['price_isNumberic'] = false;
                this.errors['price_minMax']= false;
            }
        }


        return this.errors;
    }


    /**
     * Reactive variables for Snackbar, Progress, etc.
     */
    setReactiveError() {
        this.reactiveError.next(true);
        this.reactiveSubmit.next(false);
    }
    getReactiveError() {
        return this.reactiveError;
    }


    /**
     * Reactive variable for Titles on Edit forms
     */
    setReactiveHideToolbar(display) {
        this.reactiveHideToolbarVal.next(display);
    }
    getReactiveHideToolbar() {
        return this.reactiveHideToolbarVal;
    }


    /**
     * Reactive variable for Titles names on other pages
     */
    setReactiveTitleName(display) {
        this.reactiveTitleName.next(display);
    }
    getReactiveTitleName() {
        return this.reactiveTitleName;
    }


}

