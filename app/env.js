'use strict';

var ENV = {};
var path = require('path');

/**
 * Normalize a port into a number, string, or false
 * @param {Number} val port
 * @returns {Boolean|Number}
 */
var normalizePort = function(val){
    var port = Number.parseInt(val, 10);

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
 * Alkalmazás gyökérkönyvtár
 * @type {String}
 */
global.appRoot = path.resolve(`${__dirname}/..`);

/**
 * Alkalmazás státusza ("dev"|"test"|"prod")
 * @type {String}
 */
ENV.PROJECT = 'dev';

// Környezet beállítása
if (ENV.PROJECT === 'dev'){
    ENV.DOMAIN = 'localhost';
    ENV.WSPORT = '3000';
    ENV.PORT = normalizePort('3000');
    ENV.IPADDRESS = '127.0.0.1';
}
else if (ENV.PROJECT === 'test'){
    ENV.DOMAIN = '213.181.208.32';
    ENV.WSPORT = '3000';
    ENV.PORT = normalizePort('3000');
    ENV.IPADDRESS = '213.181.208.32';
}
else if (ENV.PROJECT === 'prod'){
    ENV.DOMAIN = 'chat.webprog.biz';
    ENV.WSPORT = '80';
    ENV.PORT = normalizePort('80');
    ENV.IPADDRESS = '213.181.208.32';
}

module.exports = ENV;
