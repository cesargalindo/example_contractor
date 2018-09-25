/**
 * http://stepansuvorov.com/blog/2017/03/angular-lazy-loading-and-preloading-strategy/
 */

import { PreloadingStrategy, Route } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';


export class AppCustomPreloader implements PreloadingStrategy {
    preload(route: Route, fn: () => Observable<boolean>): Observable<boolean> {
        return route.data && route.data.preload ? Observable.of(true).delay(100).flatMap( (_: boolean)=> fn()) : Observable.of(null);
    }
}
