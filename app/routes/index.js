/* global */

'use strict';

var express = require('express');
var router = express.Router();
var log = require.main.require('../libs/log.js');
// var session = require('express-session');
var Model;

router.use(function(req, res, next){
    Model = require.main.require('../app/models/mongodb/chat.js')(req.app.get('db'));
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
    db.collection('chat_users')
        .find()
        .toArray()
        .then(function(docs){
            users = docs;
        })
        .then(function(){
            return db.collection('chat_messages').find().toArray();
        })
        .then(function(docs){
            messages = docs;
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
