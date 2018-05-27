'use strict';

const express = require('express');
const router = express.Router();
// const session = require('express-session');

router.get('/', function(req, res){
    req.session.login = {
        loginned : false,
        userId : null,
        userName : '',
        error : null
    };
    req.session.save(function(){
        res.redirect('/');
    });
});

module.exports = router;
