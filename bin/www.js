/*!
 * Gomoku v1.0.0 alpha
 * Copyright (c) 2016.03.11.
 */

'use strict';

var app;
// var http = require('http');
// var debug = require('debug')('nodeapp:server');

/**
 * Normalize a port into a number, string, or false
 * @param {Number} val port
 * @returns {Boolean|Number}
 */
var normalizePort = function(val){
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
};

// Környezet lekérdezése
global.DOMAIN = process.env.NODE_ENV === 'production' ? 'gomoku-herbertusz.rhcloud.com' : 'localhost';
global.WSPORT = process.env.NODE_ENV === 'production' ? '8000' : '3000';
global.PORT = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || '3000');
global.IPADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app = require('../app/app.js');

// Port tárolása az Express-ben
app.set('port', global.PORT);

// Port figyelése
app.httpServer.listen(global.PORT, global.IPADDRESS, function(){
	console.log(`Listening ${global.IPADDRESS}:${global.PORT}`);
});
