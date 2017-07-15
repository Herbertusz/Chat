/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');

const connections = {
    development : {
        host : ENV.HOST,
        user : 'root',
        pass : '',
        database : 'hdchat',
        charset : 'utf8_unicode_ci'
    },
    production : {
        host : ENV.HOST,
        user : 'root',
        pass : '',
        database : 'hdchat',
        charset : 'utf8_unicode_ci'
    }
};

const dbConn = connections[ENV.PROJECT];

module.exports = dbConn;
