/*!
 * Chat v1.0.0 alpha
 * Copyright (c) 2016.12.31.
 */
/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
const log = require.main.require('../libs/log.js');

require.main.require('../app/app.js')
    .then(function(app){

        // Port tárolása az Express-ben
        app.set('port', ENV.PORT);

        // Port figyelése
        app.httpServer.listen(ENV.PORT, ENV.HOST, function(){
            console.log(`Listening ${ENV.HOST}:${ENV.PORT}  driver: ${ENV.DBDRIVER}`);
        });

    })
    .catch(function(error){
        log.error(error);
    });
