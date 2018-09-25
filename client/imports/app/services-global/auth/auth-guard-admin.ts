import { Injectable }                                                           from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }     from '@angular/router';
import { AuthService }                                                          from './auth.service';

@Injectable()
export class AuthGuardAdmin implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this.authService.isAdmin ) { return true; }

        // Store the attempted URL for redirecting
        this.authService.redirectUrl = state.url;

        console.log('STATE URL == ' + state.url);
        // Navigate to the home page
        this.router.navigate(['/landing']);
        return false;
    }

}
