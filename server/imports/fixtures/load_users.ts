import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { loadLedgers } from '../fixtures/load_ledgers';

export function loadUsers() {

    if (Meteor.users.find().count() === 0) {

        // Super Admin users
        addUserDelayed('0000000000', 'cesar@mutilo.com', 'mutilo11!!', 'superadmin', 1);
        addUserDelayed('0000000001', 'henri@zojab.com', 'mutilo11!!', 'superadmin', 2);
        addUserDelayed('0000000002', 'liang@zojab.com', 'mutilo11!!', 'superadmin', 3);        
        addUserDelayed('0000000003', 'cesar+1@mutilo.com', 'mutilo11', '', 4);
        addUserDelayed('0000000004', 'cesar+2@mutilo.com', 'mutilo11', '', 5);
        addUserDelayed('0000000005', 'cdgalindo@yahoo.com', 'Pepe333###', '', 6);
        addUserDelayed('0000000006', 'esojseyer79@gmail.com', 'Pepe333###', '', 7);
        addUserDelayed('0000000007', 'Pinaquis@hotmail.com', 'Pepe333###', '', 8);
        addUserDelayed('0000000008', 'gvivian4424@gmail.com', 'Pepe333###', '', 9);
        addUserDelayed('0000000009', 'alecto209@yahoo.com', 'Pepe333###', '', 10);
        
        addUserDelayed('0000000201', 'test+1@mutilo.com', 'MrZoJab1122', '', 11);
        addUserDelayed('0000000202', 'test+2@mutilo.com', 'MrZoJab1122', '', 12);
        addUserDelayed('0000000203', 'test+3@mutilo.com', 'MrZoJab1122', '', 13);
        addUserDelayed('0000000204', 'test+4@mutilo.com', 'MrZoJab1122', '', 14);
        addUserDelayed('0000000205', 'test+5@mutilo.com', 'MrZoJab1122', '', 15);
        addUserDelayed('0000000206', 'test+6@mutilo.com', 'MrZoJab1122', '', 16);
        addUserDelayed('0000000207', 'test+7@mutilo.com', 'MrZoJab1122', '', 17);
        addUserDelayed('0000000208', 'test+8@mutilo.com', 'MrZoJab1122', '', 18);

        addUserDelayed('0000000209', 'avag@zojab.com', 'mutilo11', '', 19);
        addUserDelayed('0000000210', 'barbg@zojab.com', 'mutilo11', '', 20);        
        addUserDelayed('0000000012', 'samg@zojab.com', 'mutilo11', '', 21);

        loadLedgersDelayed(20);
    }

};



/**
 * Add user delayed to avoid overloading mongodb with connections
 * 
 * @param username 
 * @param email 
 * @param password 
 * @param role 
 * @param cnt 
 */
function addUserDelayed(username, email, password, role, cnt) {
    let delay = 1000 * cnt;

    Meteor.setTimeout(function () {
        console.log(username + ' -2- ' + email + ' -2- ' + role + ' -2- ' + delay);
        let userInfo = Accounts.createUser({
            username: username,
            email: email,
            password: password
        });loadLedgersDelayed

        if (role) {
            Roles.addUsersToRoles( userInfo, [ role ] );            
        }

        addCustomUserProfileFields(userInfo, 'fname'+cnt, 'lname'+cnt, true, 'vv'+cnt);
    }, delay);
}


function loadLedgersDelayed(cnt) {
    let delay = 1000 * cnt;
    
    Meteor.setTimeout(function () {
        loadLedgers();
    }, delay);

}


/**
 * add additional fields per Meteor guidelines - https://guide.meteor.com/accounts.html#adding-fields-on-registration
 * 
 * @param userId 
 * @param firstname 
 * @param lastname 
 * @param verfied 
 * @param paypalId 
 */
function addCustomUserProfileFields(userId, firstname, lastname, verfied, paypalId) {
    Meteor.users.update(userId, {
        $set: {
            userProfile: {
                firstname: firstname,
                lastname: lastname,
                paypalId: paypalId
            },
            cellVerified: verfied
        }
    });
}

