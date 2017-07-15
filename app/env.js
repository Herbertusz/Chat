/**
 *
 */

'use strict';

const ENV = {};
const path = require('path');

/**
 * Normalize a port into a number, string, or false
 * @param {Number|String} val - port
 * @returns {Boolean|Number}
 */
const normalizePort = function(val){
    const port = Number.parseInt(val, 10);

    if (isNaN(port)){
        // named pipe
        return val;
    }

    if (port >= 0){
        // port number
        return port;
    }

    return false;
};

/**
 * Alkalmazás státusza ('development'|'production')
 * @type {String}
 */
ENV.PROJECT = process.env.NODE_ENV || 'development';

// Környezet beállítása
if (ENV.PROJECT === 'development'){
    ENV.DOMAIN = 'localhost';
    ENV.WSPORT = '3000';
    ENV.PORT = '3000';
    ENV.HOST = 'localhost';
    ENV.DBDRIVER = 'mongodb'; // mongodb|mysql
}
else if (ENV.PROJECT === 'production'){
    ENV.DOMAIN = 'chat.bauhh.hu';
    ENV.WSPORT = '80';
    ENV.PORT = '3000';
    ENV.HOST = 'localhost';
    ENV.DBDRIVER = 'mongodb';
}

ENV.PORT = normalizePort(ENV.PORT);

module.exports = ENV;
