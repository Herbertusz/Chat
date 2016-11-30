/* global */

'use strict';

const ENV = require.main.require('../app/env.js');
const CHAT = require.main.require('../app/config.js');

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
