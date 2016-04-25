'use strict';

/* global appRoot */

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var DB = require(`${appRoot}/app/models/dbconnect.js`);

router.post('/', function(req, res){
	var username, password;
	if (req.body.submit){
		username = req.body.username;
		password = req.body.password;

		DB.query(`
			SELECT * FROM chat_users WHERE username = :username AND password = :password AND active = 1
		`, {
			username : username,
			password : password
		}, function(error, rows){
			if (error) throw error;
			if (rows.length > 0){
				req.session.login = {
					loginned : true,
					userId : rows[0].id,
					userName : username,
					error : null
				};
			}
			else {
				req.session.login.error = 'Nem jó!!!';
			}
			res.redirect('/');
		});
	}
});

module.exports = router;
