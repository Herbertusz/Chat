/* global appRoot */

'use strict';

var CHAT = require(`${appRoot}/app/config.js`);

module.exports = function(app){

    app.locals.CHAT = CHAT;
    app.locals.layout = {
        DOMAIN : global.DOMAIN,
        WSPORT : global.WSPORT,
        menu : [
            {
                text : 'Főoldal',
                url : '/index'
            },
            {
                text : 'Chat',
                url : '/chat'
            }
        ]
    };

};
