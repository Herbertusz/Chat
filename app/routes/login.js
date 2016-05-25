'use strict';

/* global appRoot */

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var Model;

router.use(function(req, res, next){
	Model = require(`${appRoot}/app/models/login.js`)(req.app.get('db'));
	next();
});

router.post('/', function(req, res){
	if (req.body.submit){
		const data = {
			username : req.body.username,
			password : req.body.password
		};

		Model.getUser(data, function(user){
			if (user){
				req.session.login = {
					loginned : true,
					userId : user.id,
					userName : user.name,
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
