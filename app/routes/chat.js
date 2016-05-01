/* global appRoot */

'use strict';

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var fs = require('fs');
var Model = require(`${appRoot}/app/models/chat.js`);
var HD = require(`${appRoot}/libs/hd/hd.math.js`);

router.get('/', function(req, res){

	Model.getUsers(function(users){
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

	Model.getRoomMessages(req.body.roomName, function(messages){
		res.send({
			messages : messages
		});
	});

});

router.post('/uploadfile', function(req, res){

	var data, userId, fileName, fileStream, uploadedSize, fileSize;
	var io = req.app.get('io');

	if (req.xhr){
		data = JSON.parse(decodeURIComponent(req.header('X-File-Data')));
		userId = Number.parseInt(data.userId);
		fileName = `${Date.now()}-${HD.Math.rand(100, 999)}.${data.fileData.name.split('.').pop()}`;
		fileStream = fs.createWriteStream(`${appRoot}/app/public/upload/${fileName}`);
		uploadedSize = 0;
		fileSize = Number.parseInt(data.fileData.size);

		req.on('data', function(file){
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
			io.of('/chat').to(data.roomName).emit('fileReceive', {
				userId : userId,
				roomName : data.roomName,
				uploadedSize : fileSize,
				fileSize : fileSize,
				firstSend : false
			});
			res.send({
				filePath : `upload/${fileName}`
			});
		});
	}


});

module.exports = router;
