/**
 *
 */

'use strict';

const ENV = {};
const path = require('path');
const environment = require.main.require('../storage/env.js');

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
ENV.DOMAIN = environment[ENV.PROJECT].domain;
ENV.WSPORT = normalizePort(environment[ENV.PROJECT].wsport);
ENV.PORT = normalizePort(environment[ENV.PROJECT].port);
ENV.HOST = environment[ENV.PROJECT].host;
ENV.DBDRIVER = environment[ENV.PROJECT].dbdriver;
ENV.DB = environment[ENV.PROJECT].db;

module.exports = ENV;
