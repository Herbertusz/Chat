/*!
 * Chat v1.0.0 alpha
 * Copyright (c) 2016.04.27.
 */

/* global appRoot */

'use strict';

var ENV = require('../app/env.js');
var log = require(`${appRoot}/libs/log.js`);

require('../app/app.js')
    .then(function(app){

        // Port tárolása az Express-ben
        app.set('port', ENV.PORT);

        // Port figyelése
        app.httpServer.listen(ENV.PORT, ENV.IPADDRESS, function(){
            console.log(`Listening ${ENV.IPADDRESS}:${ENV.PORT}`);
        });

    }).catch(function(error){
        log.error(error);
    });
