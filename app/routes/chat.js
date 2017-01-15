/**
 *
 */

'use strict';

let UserModel, ChatModel;
const ENV = require.main.require('../app/env.js');
const express = require('express');
const router = express.Router();
// const session = require('express-session');
const fs = require('fs'); // TODO: mz/fs
const log = require.main.require('../libs/log.js');
const HD = require.main.require('../app/public/js/hd/hd.js')(['datetime']);

router.use(function(req, res, next){
    UserModel = require.main.require(`../app/models/${ENV.DBDRIVER}/user.js`)(req.app.get('db'));
    ChatModel = require.main.require(`../app/models/${ENV.DBDRIVER}/chat.js`)(req.app.get('db'));
    next();
});

router.get('/', function(req, res){

    UserModel
        .getUsers()
        .then(function(users){
            res.render('layout', {
                page : 'chat',
                users : users,
                login : req.session.login ? req.session.login.loginned : false,
                userId : req.session.login ? req.session.login.userId : null,
                userName : req.session.login ? req.session.login.userName : '',
                loginMessage : null
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

router.get('/remote/:userId', function(req, res){

    const userId = Number(req.params.userId);

    req.app.set('userId', userId);

    UserModel
        .getUsers()
        .then(function(users){
            res.render('layout_iframe', {
                page : 'chat',
                users : users,
                login : true,
                userId : userId,
                userName : users.find(function(user){
                    return user.id === userId;
                }).name,
                loginMessage : null
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

router.post('/getroommessages', function(req, res){

    ChatModel.getRoomMessages(req.body.roomName)
        .then(function(messages){
            res.send({
                messages : messages
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

router.post('/statuschange', function(req, res){

    ChatModel.setStatus({
        userId : req.body.userId,
        prevStatus : req.body.prevStatus,
        nextStatus : req.body.nextStatus
    })
        .then(function(){
            res.send({
                success : true
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

router.post('/getstatus', function(req, res){

    ChatModel.getLastStatus(req.body.userId)
        .then(function(status){
            res.send({
                status : status
            });
        })
        .catch(function(error){
            log.error(error);
        });

});

router.get('/file/:roomName/:fileName', function(req, res, next){

    ChatModel
        .getFile(req.param.roomName, req.param.fileName)
        .then(function(file){
            // TODO: fájl megjelenítése
        })
        .catch(function(error){
            log.error(error);
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
                filePath : `/upload/${data.fileName}`
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

    fs.appendFile(`${__dirname}/../../logs/client.log`, logMessage, function(error){
        if (error){
            log.error(error);
        }
        res.send({});
    });

});

module.exports = router;
