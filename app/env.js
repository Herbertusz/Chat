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
 * Alkalmazás státusza ('dev'|'test'|'prod')
 * @type {String}
 */
ENV.PROJECT = 'dev';

// Környezet beállítása
if (ENV.PROJECT === 'dev'){
    ENV.DOMAIN = 'localhost';
    ENV.WSPORT = '3000';
    ENV.PORT = '3000';
    ENV.IPADDRESS = '127.0.0.1';
    ENV.DBDRIVER = 'mysql'; // mongodb|mysql
}
else if (ENV.PROJECT === 'test'){
    ENV.DOMAIN = '213.181.208.32';
    ENV.WSPORT = '3000';
    ENV.PORT = '3000';
    ENV.IPADDRESS = '213.181.208.32';
    ENV.DBDRIVER = 'mongodb';
}
else if (ENV.PROJECT === 'prod'){
    ENV.DOMAIN = 'chat.web-prog.hu';
    ENV.WSPORT = '80';
    ENV.PORT = '80';
    ENV.IPADDRESS = '213.181.208.32';
    ENV.DBDRIVER = 'mongodb';
}

ENV.PORT = normalizePort(ENV.PORT);

module.exports = ENV;
