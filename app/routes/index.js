'use strict';

/* global appRoot */

var express = require('express');
var router = express.Router();
// var session = require('express-session');

router.get('/', function(req, res){
	var message;
	if (!req.session.login){
		req.session.login = {
			loginned : false,
			userId : null,
			userName : '',
			error : null
		};
	}
	message = req.session.login.error;
	req.session.login.error = null;

	const db = req.app.get('db');

	const cursorU = db.collection('chat_users').find();
	const users = [];
	cursorU.forEach(function(doc){
		users.push(doc);
	}, function(){
		const cursorM = db.collection('chat_messages').find();
		const messages = [];
		cursorM.forEach(function(doc){
			messages.push(doc);
		}, function(){
			res.render('layout', {
				page : 'index',
				login : req.session.login ? req.session.login.loginned : false,
				userId : req.session.login ? req.session.login.userId : null,
				userName : req.session.login ? req.session.login.userName : '',
				loginMessage : message,
				users : users,
				messages : messages
			});
		});
	});
});

module.exports = router;
