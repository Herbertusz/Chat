/**
 *
 */

'use strict';

let ChatModel, UserModel;
const ENV = require.main.require('../app/env.js');
const express = require('express');
const router = express.Router();
// const session = require('express-session');

router.use(function(req, res, next){
    UserModel = require.main.require(`../app/models/${ENV.DBDRIVER}/user.js`)(req.app.get('db'));
    ChatModel = require.main.require(`../app/models/${ENV.DBDRIVER}/chat.js`)(req.app.get('db'));
    next();
});

router.get('/', function(req, res){

    UserModel.getUsers(function(users){
        res.set('Access-Control-Allow-Origin', '213.181.208.32');
        res.render('layout', {
            page : 'videochat',
            users : users,
            login : req.session.login ? req.session.login.loginned : false,
            userId : req.session.login ? req.session.login.userId : null,
            userName : req.session.login ? req.session.login.userName : '',
            loginMessage : null
        });
    });

});

module.exports = router;
