/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
const Config = require.main.require('../app/config/config.js');
const Labels = require.main.require('../app/public/js/chat/labels.js');
const CHAT = Object.assign({}, Config, Labels);

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
                text : 'Iframe-Hörb',
                url : '/iframe/1'
            },
            {
                text : 'Iframe-Dan',
                url : '/iframe/2'
            },
            {
                text : 'Iframe-Pistike',
                url : '/iframe/3'
            },
            {
                text : 'Videochat',
                url : '/videochat'
            }
        ]
    };

};
