import { Meteor } from 'meteor/meteor';
import { Favorites } from '../../both/collections/favorites.collection';
import { Favorite } from '../../both/models/favorite.model';

let Future = Npm.require( 'fibers/future' );

export function makeFavoritesIfNone(userId) {
    let favExist = Favorites.findOne({owner: this.userId});
    console.log(favExist);
    if(!favExist) {
        let f1:FAVITEM = {id: itemId, created: new Date().getTime()};            
        // Store FAVITEM objec in an array
        let c1 = new Array();
        c1.push(f1);
    }
}
    