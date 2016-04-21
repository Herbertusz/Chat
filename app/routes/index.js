'use strict';

/* global appRoot */

var express = require('express');
var router = express.Router();
//var session = require('express-session');
var HD = require(appRoot + '/libs/hd/hd.datetime.js');
var DB = require(appRoot + '/app/models/dbconnect.js');

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

	DB.query(`
		SELECT * FROM chat_users
	`, function(error, rows){
		if (error) throw error;
		rows.forEach(function(row, i){
			rows[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(row.created) / 1000));
		});
		res.render('layout', {
			page : 'index',
			login : req.session.login ? req.session.login.loginned : false,
			userId : req.session.login ? req.session.login.userId : null,
			userName : req.session.login ? req.session.login.userName : '',
			loginMessage : message,
			users : rows
		});
	});
});

module.exports = router;
