import { Issues } from '../../../both/collections/issues.collection';
import { Issue } from '../../../both/models/issue.model';

export function loadIssues() {

    var currentDate = new Date().getTime();

    if (Issues.find().cursor.count() === 0) {

        let a = new Array();

        let p1:rpid = { rpid: 'moo' };
        let p2:rpid = { rpid: 'boo' };

        a.push(p1);
        a.push(p2);

        let issue = <Issue>{};
        issue.severity = 'MEDUIM';
        issue.priceId = 'x1x1x2255';
        issue.created = currentDate;
        issue.rpids = a;
        issue.note = 'a test entry';

        Issues.insert(issue);

    }
}

