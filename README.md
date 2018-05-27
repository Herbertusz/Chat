# HD-chat
Chat alkalmazás (Node.js, Socket.io)

Demo: [http://chat.web-prog.hu](http://chat.web-prog.hu)

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
