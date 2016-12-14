/*!
 * Chat v1.0.0 alpha
 * Copyright (c) 2016.11.18.
 */

/* global */

'use strict';

const ENV = require.main.require('../app/env.js');
const log = require.main.require('../libs/log.js');

require.main.require('../app/app.js')
    .then(function(app){

        // Port tárolása az Express-ben
        app.set('port', ENV.PORT);

        // Port figyelése
        app.httpServer.listen(ENV.PORT, ENV.IPADDRESS, function(){
            console.log(`Listening ${ENV.IPADDRESS}:${ENV.PORT}  driver: ${ENV.DBDRIVER}`);
        });

    })
    .catch(function(error){
        log.error(error);
    });
