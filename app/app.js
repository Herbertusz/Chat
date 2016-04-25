/* global appRoot */

'use strict';

var io;
var path = require('path');
var http = require('http');
var express = require('express');
var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessionModule = require('express-session');
var FileStore = require('session-file-store')(sessionModule);

var app, server, routes, session;

global.appRoot = path.resolve(`${__dirname}/..`);

app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(favicon(`${__dirname}/public/favicon.png`));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

session = sessionModule({
	secret : "Kh5Cwxpe8wCXNaWJ075g",
	resave : false,
	saveUninitialized : false,
	reapInterval : -1,
	store : new FileStore({
		path : `${appRoot}/tmp`
	})
});
app.use(session);

// Layout
require(`${appRoot}/app/layout.js`)(app);

// Websocket
server = http.createServer(app);
io = require(`${appRoot}/app/websocket.js`)(server, session);
app.set('io', io);

// Route
routes = [
	['/', require('./routes/index')],
	['/chat', require('./routes/chat')],
	['/login', require('./routes/login')],
	['/logout', require('./routes/logout')]
];
routes.forEach(function(route){
	app.use(route[0], route[1]);
});


// Hibakezelők

app.use(function(req, res, next){
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

if (app.get('env') === 'development'){
	app.use(function(err, req, res){
		res.status(err.status || 500);
		res.render('error', {
			message : err.message,
			error : err
		});
	});
}

app.use(function(err, req, res){
	res.status(err.status || 500);
	res.render('error', {
		message : err.message,
		error : {}
	});
});

module.exports = app;
module.exports.httpServer = server;
