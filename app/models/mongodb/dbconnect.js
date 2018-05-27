/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
let dbUrl;

const connection = ENV.DB.mongodb;

if (connection.user.length > 0){
    dbUrl = `mongodb://${connection.user}:${connection.pass}@${connection.host}:${connection.port}/${connection.app}`;
}
else {
    dbUrl = `mongodb://${connection.host}:${connection.port}/${connection.app}`;
}

module.exports = dbUrl;
