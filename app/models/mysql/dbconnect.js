/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');

const connection = ENV.DB.mysql;

module.exports = connection;
