/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
let dbUrl;

const connections = {
    development : {
        host : ENV.HOST,
        port : 27017,
        user : '',
        pass : '',
        app : 'chat'
    },
    production : {
        host : ENV.HOST,
        port : 27017,
        user : 'hdchat',
        pass : 'bALtiGqzKfSqdAN8',
        app : 'hdchat'
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
