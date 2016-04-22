'use strict';

var express = require('express');
var router = express.Router();
//var session = require('express-session');

router.get('/', function(req, res){
	req.session.login = {
		loginned : false,
		userId : null,
		userName : '',
		error : null
	};
	res.redirect('/');
});

module.exports = router;
