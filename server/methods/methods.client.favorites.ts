import { Meteor } from 'meteor/meteor';
import { Favorites } from '../../both/collections/favorites.collection';
import { Favorite } from '../../both/models/favorite.model';

Meteor.methods({

    /**
     * Add fav item
     * Since call is async, we are not worried about returned status  - set to true by default
     *
     */
    'add.favorite.item'(itemId: string) {
        check(itemId, String);
        
        
        // Verify user of Client App is logged in
        if (this.userId) {

            // Check if user already has this fav, if so return
            let checkIfAlreadyInFavoirtes = Favorites.findOne({owner: this.userId, "favItems.id": itemId});            
            if (checkIfAlreadyInFavoirtes) {
                console.log('already added ', itemId )
                return { status: true }
            }

            let favExist = Favorites.findOne({owner: this.userId });
            console.log(favExist);
            
            // Update existing Favorite Object
            if (!favExist) {
                Favorites.insert({
                    owner: this.userId
                });
            }
  
            Favorites.update(
                { "owner": this.userId },
                { "$push": { "favItems": { "id": itemId, created:  new Date().getTime() } } }
            ).subscribe(count => {
                if(count) {
                    console.log('SUCCESS: --311-- updated favorite item  = ' + itemId);
                }
                else {
                    console.error('ERROR: --311-- UNABLE to update favorite item  = ' + itemId);
                }
            });          
    
            return { status: true }
        }
    },


    /**
     * Remove fav item
     * Since call is async, we are not worried about returned status  - set to true by default
     *
     */
    'remove.favorite.item'(itemId: string) {
        check(itemId, String);
        
        // Verify user of Client App is logged in
        if (this.userId) {

            // Grab Id of existing Favorite object
            let favExist = Favorites.findOne({owner: this.userId});

            // Update existing Favorite Object
            if (favExist) {
                
                // Pull existing Item out of favItems Array
                Favorites.update(favExist._id, {
                    $pull: { 
                        favItems: { 
                            id: itemId 
                        }
                    }
                }).subscribe(count => {
                    if(count) {
                        console.log('SUCCESS: --311-- removed favorite item  = ' + itemId);
                    }
                    else {
                        console.error('ERROR: --311-- UNABLE to REMOVE favorite item  = ' + itemId);
                    }
                });          
     
            }
            // Error - bogus itemId supplied
            else {
                return { status: false, error: 'invalid favorite item' }
            }

            return { status: true }
        }
    },

    //add fav store
    'add.favorite.store'(storeId: string) {
        check(storeId, String);
        
        // Verify user of Client App is logged in
        if (this.userId) {

            // Check if user already has this fav, if so return
            let checkIfAlreadyInFavoirtes = Favorites.findOne({owner: this.userId, "favStores.id": storeId});            
            if (checkIfAlreadyInFavoirtes) {
                console.log('already added ', storeId )
                return { status: true }
            }

            let favExist = Favorites.findOne({owner: this.userId });
            console.log(favExist);
            
            // Update existing Favorite Object
            if (!favExist) {
                Favorites.insert({
                    owner: this.userId
                });
            }
  
            Favorites.update(
                { "owner": this.userId },
                { "$push": { "favStores": { "id": storeId, created:  new Date().getTime() } } }
            ).subscribe(count => {
                if(count) {
                    console.log('SUCCESS: --311-- updated favorite item  = ' + storeId);
                }
                else {
                    console.error('ERROR: --311-- UNABLE to update favorite item  = ' + storeId);
                }
            });          
    
            return { status: true }
        }
    },

    

    /**
     * Remove fav store
     * Since call is async, we are not worried about returned status  - set to true by default
     *
     */
    'remove.favorite.store'(storeId: string) {
        check(storeId, String);
        
        // Verify user of Client App is logged in
        if (this.userId) {

            // Grab Id of existing Favorite object
            let favExist = Favorites.findOne({owner: this.userId});

            // Update existing Favorite Object
            if (favExist) {
                
                // Pull existing Item out of favItems Array
                Favorites.update(favExist._id, {
                    $pull: { 
                        favStores: { 
                            id: storeId 
                        }
                    }
                }).subscribe(count => {
                    if(count) {
                        console.log('SUCCESS: --311-- removed favorite store  = ' + storeId);
                    }
                    else {
                        console.error('ERROR: --311-- UNABLE to REMOVE favorite store  = ' + storeId);
                    }
                });          
     
            }
            // Error - bogus itemId supplied
            else {
                return { status: false, error: 'invalid favorite store' }
            }

            return { status: true }
        }
    },

    



});


