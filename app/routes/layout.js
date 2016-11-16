/* global */

'use strict';

var ENV = require(`../../app/env.js`);
var CHAT = require(`../../app/config.js`);

module.exports = function(app){

    app.locals.CHAT = CHAT;
    app.locals.layout = {
        DOMAIN : ENV.DOMAIN,
        WSPORT : ENV.WSPORT,
        publicPath : app.get('public path'),
        menu : [
            {
                text : 'Főoldal',
                url : '/'
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
