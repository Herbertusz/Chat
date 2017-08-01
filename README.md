# HD-chat
Chat alkalmazás (Node.js, Socket.io)

storage/env.js

    'use strict';

    module.exports = {
        development : {
            domain : 'localhost',
            wsport : '3000',
            port : '3000',
            host : 'localhost',
            dbdriver : 'mongodb',
            db : {
                mongodb : {
                    host : 'localhost',
                    port : 27017,
                    user : '',
                    pass : '',
                    app : 'chat'
                },
                mysql : {
                    host : 'localhost',
                    user : 'root',
                    pass : '',
                    database : 'hdchat',
                    charset : 'utf8_unicode_ci'
                }
            }
        },
        production : {
            domain : '',
            wsport : '',
            port : '',
            host : '',
            dbdriver : '',
            db : {
                mongodb : {
                    host : '',
                    port : 27017,
                    user : '',
                    pass : '',
                    app : ''
                },
                mysql : {
                    host : '',
                    user : '',
                    pass : '',
                    database : '',
                    charset : 'utf8_unicode_ci'
                }
            }
        }
    };

Events

event: 'roomCreated'
triggerId: userId (=starter)
userId: Array.userId
room: roomName

event: 'roomJoin'
triggerId: userId (=)
userId: userId (=)
room: roomName

event: 'roomLeave'
triggerId: userId (=)
userId: userId (=)
room: roomName

event: 'roomForceJoin'
triggerId: userId
userId: userId
room: roomName

event: 'roomForceLeave'
triggerId: userId
userId: userId
room: roomName
