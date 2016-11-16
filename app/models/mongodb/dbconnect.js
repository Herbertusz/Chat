/* global */

'use strict';

var ENV = require(`../../env.js`);
var dbUrl;

const connections = {
    dev : {
        host : ENV.IPADDRESS,
        port : 27017,
        user : '',
        pass : '',
        app : 'chat'
    },
    test : {
        host : ENV.IPADDRESS,
        port : 27017,
        user : 'chat',
        pass : 'bALtiGqzKfSqdAN',
        app : 'chat'
    },
    prod : {
        host : ENV.IPADDRESS,
        port : 27017,
        user : 'chat',
        pass : 'bALtiGqzKfSqdAN',
        app : 'chat'
    }
};

const dbConn = connections[ENV.PROJECT];

if (dbConn.user.length > 0){
    dbUrl = `mongodb://${dbConn.user}:${dbConn.pass}@${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}
else {
    dbUrl = `mongodb://${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}

module.exports = dbUrl;
