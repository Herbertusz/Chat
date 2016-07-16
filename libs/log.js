/* global appRoot */

'use strict';

var winston = require('winston');

var Log = new (winston.Logger)({
    transports : [
        new winston.transports.File({
            filename : `${appRoot}/logs/debug.log`,
            json : false,
            handleExceptions : true,
            humanReadableUnhandledException : true
        })
    ],
    exceptionHandlers : [
        new winston.transports.File({
            filename : `${appRoot}/logs/exception.log`,
            json : false
        })
    ],
    exitOnError : false
});

module.exports = Log;
