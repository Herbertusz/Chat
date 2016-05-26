'use strict';

/* global appRoot */

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var Model;

router.use(function(req, res, next){
    Model = require(`${appRoot}/app/models/chat.js`)(req.app.get('db'));
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

    /*
    Model.setMessage({
        userId : 2,
        room : "room-1-1463862537235",
        message : "Na mi a hézag?",
        time : 1463862537
    }, function(id){
        console.log(id);
    });

    Model.setFile({
        userId : 2,
        room : "room-1-1463862537235",
        fileData : {
            "name" : "valami.png",
            "size" : 50000,
            "type" : "image/png"
        },
        "mainType" : "image",
        "store" : "upload",
        "file" : "/upload/1463315457937-356.png",
        time : 1463862550
    }, function(id){
        console.log(id);
    });

    Model.deleteFile("room-1-1463862537235", function(urls){
        console.log(urls);
    });
    */

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
            console.log(error.name);
            console.log(error.message);
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
