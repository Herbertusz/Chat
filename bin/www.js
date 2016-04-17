/*!
 * Gomoku v1.0.0 alpha
 * Copyright (c) 2016.03.11.
 */

'use strict';

var http = require('http');
//var debug = require('debug')('nodeapp:server');

// Környezet lekérdezése
global.DOMAIN = process.env.NODE_ENV === 'production' ? 'gomoku-herbertusz.rhcloud.com' : 'localhost';
global.WSPORT = process.env.NODE_ENV === 'production' ? '8000' : '3000';
global.PORT = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || '3000');
global.IPADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var app = require('../app/app.js');

// Port tárolása az Express-ben
app.set('port', PORT);

// Port figyelése
app.httpServer.listen(PORT, IPADDRESS, function(){
	console.log('Listening ' + IPADDRESS + ':' + PORT);
});

/**
 * Normalize a port into a number, string, or false
 * @param {Number} val port
 * @returns {Boolean|Number}
 */
function normalizePort(val){
	var port = parseInt(val, 10);

	if (isNaN(port)){
		// named pipe
		return val;
	}

	if (port >= 0){
		// port number
		return port;
	}

	return false;
}
