import { Meteor } from 'meteor/meteor';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { VariablesService } from '../../services-global/VariablesService';

import template from './setPassword.component.html';

@Component({
    selector: 'setpassword',
    template
})
export class SetPasswordComponent implements OnInit {

    setPasswordForm: FormGroup;
    error: string;
    display_spinner: boolean = false;

    constructor(
        public _varsService: VariablesService,
        private formBuilder: FormBuilder,
        private router: Router) { }


    ngOnInit() {
        this.error = '';

        this.setPasswordForm = this.formBuilder.group({
            password: [''],
            confirmPassword: ['']
        });
    }

    ngAfterViewInit() {
        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(false);
        this._varsService.setReactiveTitleName('SETTINGS');
    }

    setPassword() {

        // Validate form fields
        if ( this.passwordValidator(this.setPasswordForm.value.password) ) {
            if ( this.passwordMatchCheck(this.setPasswordForm.value.confirmPassword) ) {
                // all systems go
            }
            else {
                return;
            }
        }
        else {
            return;
        }

        this.display_spinner = true;

        // Change user password
        Meteor.call('setUserPassword', this.setPasswordForm.value.password, (error, res) => {

            this.display_spinner = false;

            if (error) {
                this.error = error;
            }
            else {
                this.router.navigate(['/settings']);
            }
        });

    }


    passwordValidator(password: string): boolean {
        if ( (password.length > 5) && (password.length < 41) ) {
            return true;
        }
        return false;
    }


    passwordMatchCheck(confirmPassword): boolean {
        if (this.setPasswordForm.value.password == confirmPassword) {
            return true;
        }

        return false;
    }

}