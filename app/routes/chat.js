/* global */

'use strict';

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var fs = require('fs');
var HD = require.main.require('../libs/hd/hd.datetime.js');
var log = require.main.require('../libs/log.js');
var UserModel, ChatModel;

router.use(function(req, res, next){
    UserModel = require.main.require('../app/models/mongodb/user.js')(req.app.get('db'));
    ChatModel = require.main.require('../app/models/mongodb/chat.js')(req.app.get('db'));
    next();
});

router.get('/', function(req, res){

    UserModel.getUsers(function(users){
        res.render('layout', {
            page : 'chat',
            users : users,
            login : req.session.login ? req.session.login.loginned : false,
            userId : req.session.login ? req.session.login.userId : null,
            userName : req.session.login ? req.session.login.userName : '',
            loginMessage : null
        });
    });

});

router.post('/getroommessages', function(req, res){

    ChatModel.getRoomMessages(req.body.roomName)
        .then(function(messages){
            res.send({
                messages : messages
            });
        });

});

router.post('/uploadfile', function(req, res){

    if (req.xhr){
        let uploadedSize = 0;
        const io = req.app.get('io');
        const data = JSON.parse(decodeURIComponent(req.header('X-File-Data')));
        const userId = Number.parseInt(data.userId);
        const fileStream = fs.createWriteStream(`${req.app.get('public path')}/upload/${data.fileName}`);
        const fileSize = Number.parseInt(data.fileData.size);

        req.on('data', function(file){
            // Fájlátvitel folyamatban
            const first = (uploadedSize === 0);
            uploadedSize += file.byteLength;
            io.of('/chat').to(data.roomName).emit('fileReceive', {
                userId : userId,
                roomName : data.roomName,
                uploadedSize : uploadedSize,
                fileSize : fileSize,
                firstSend : first
            });
            fileStream.write(file);
        });
        req.on('end', function(){
            // Fájlátvitel befejezve
            io.of('/chat').to(data.roomName).emit('fileReceive', {
                userId : userId,
                roomName : data.roomName,
                uploadedSize : fileSize,
                fileSize : fileSize,
                firstSend : false
            });
            res.send({
                filePath : `upload/${data.fileName}`
            });
            fileStream.end();
        });
        req.on('close', function(){
            // Fájlátvitel megszakítva
            fileStream.end();
        });
    }

});

router.post('/clientlog', function(req, res){

    const name = decodeURIComponent(req.body.name);
    const message = decodeURIComponent(req.body.message);
    const stack = decodeURIComponent(req.body.stack);
    const logMessage = `
        ${HD.DateTime.formatMS('Y-m-d H:i:s', Date.now())}
        name: ${name}
        message: ${message}
        stack:
        ${stack}
        -----
    `.replace(/^\s+/gm, '');

    fs.appendFile('../../logs/client.log', logMessage, function(error){
        if (error){
            log.error(error);
        }
        res.send({});
    });

});

module.exports = router;
