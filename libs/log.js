'use strict';

const winston = require('winston');

const Log = new (winston.Logger)({
    transports : [
        new winston.transports.File({
            level : 'info',
            name : 'info-file',
            filename : `${__dirname}/../logs/info.log`,
            json : false,
            handleExceptions : true,
            humanReadableUnhandledException : true
        }),
        new winston.transports.File({
            level : 'error',
            name : 'error-file',
            filename : `${__dirname}/../logs/debug.log`,
            json : false,
            handleExceptions : true,
            humanReadableUnhandledException : true
        })
    ],
    exceptionHandlers : [
        new winston.transports.File({
            filename : `${__dirname}/../logs/exception.log`,
            json : false,
            humanReadableUnhandledException : true
        })
    ],
    exitOnError : false
});

module.exports = Log;
