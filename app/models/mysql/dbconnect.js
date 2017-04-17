/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');

const connections = {
    dev : {
        host : ENV.IPADDRESS,
        user : 'root',
        pass : '',
        database : 'chat',
        charset : 'utf8_unicode_ci'
    },
    test : {
        host : ENV.IPADDRESS,
        user : 'chat',
        pass : '',
        database : 'chat',
        charset : 'utf8_unicode_ci'
    },
    prod : {
        host : ENV.IPADDRESS,
        user : 'chat',
        pass : '',
        database : 'chat',
        charset : 'utf8_unicode_ci'
    }
};

const dbConn = connections[ENV.PROJECT];

module.exports = dbConn;
