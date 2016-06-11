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
                text : 'Előszoba',
                url : '/index'
            },
            {
                text : 'Chat',
                url : '/chat'
            }
        ]
    };

};
