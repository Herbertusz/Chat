/* global appRoot */

'use strict';

var ENV = require(`${appRoot}/app/env.js`);
var CHAT = require(`${appRoot}/app/config.js`);

module.exports = function(app){

    app.locals.CHAT = CHAT;
    app.locals.layout = {
        DOMAIN : ENV.DOMAIN,
        WSPORT : ENV.WSPORT,
        publicPath : app.get('public path'),
        menu : [
            {
                text : 'Főoldal',
                url : '/index'
            },
            {
                text : 'Chat',
                url : '/chat'
            },
            {
                text : 'Videochat',
                url : '/videochat'
            }
        ]
    };

};
