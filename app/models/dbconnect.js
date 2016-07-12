/* global appRoot */

'use strict';

var ENV = require(`${appRoot}/app/env.js`);
var dbUrl;
let dbConn;

if (ENV.PROJECT === 'dev'){
    dbConn = {
        host : ENV.IPADDRESS,
        port : 27017,
        user : '',
        pass : '',
        app : 'chat'
    };
}
else if (ENV.PROJECT === 'test'){
    dbConn = {
        host : ENV.IPADDRESS,
        port : 27017,
        user : 'chat',
        pass : 'bALtiGqzKfSqdAN',
        app : 'chat'
    };
}
else if (ENV.PROJECT === 'prod'){
    dbConn = {
        host : ENV.IPADDRESS,
        port : 27017,
        user : 'chat',
        pass : 'bALtiGqzKfSqdAN',
        app : 'chat'
    };
}

if (dbConn.user.length > 0){
    dbUrl = `mongodb://${dbConn.user}:${dbConn.pass}@${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}
else {
    dbUrl = `mongodb://${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}

module.exports = dbUrl;
