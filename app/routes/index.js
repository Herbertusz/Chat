/* global */

'use strict';

const ENV = require.main.require('../app/env.js');
const log = require.main.require('../libs/log.js');
const express = require('express');
const router = express.Router();
// var session = require('express-session');
let UserModel, ChatModel;

router.use(function(req, res, next){
    UserModel = require.main.require(`../app/models/${ENV.DBDRIVER}/user.js`)(req.app.get('db'));
    ChatModel = require.main.require(`../app/models/${ENV.DBDRIVER}/chat.js`)(req.app.get('db'));
    next();
});

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

    let users, messages;

    UserModel.getUsers()
        .then(function(items){
            users = items;
        })
        .then(function(){
            return ChatModel.getMessages(['message', 'file']);
        })
        .then(function(items){
            messages = items;
        })
        .catch(function(error){
            log.error(error);
        })
        .then(function(){
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

module.exports = router;
