'use strict';

var winston = require('winston');

var Log = new (winston.Logger)({
    transports : [
        new winston.transports.File({
            filename : '../logs/debug.log',
            json : false,
            handleExceptions : true,
            humanReadableUnhandledException : true
        })
    ],
    exceptionHandlers : [
        new winston.transports.File({
            filename : '../logs/exception.log',
            json : false,
            humanReadableUnhandledException : true
        })
    ],
    exitOnError : false
});

module.exports = Log;
