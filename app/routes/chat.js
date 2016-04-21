'use strict';

var express = require('express');
var router = express.Router();
var session = require('express-session');
var fs = require('fs');
var Model = require(appRoot + '/app/models/chat.js');
var HD = require(appRoot + '/libs/hd/hd.math.js');

router.get('/', function(req, res, next){

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

router.post('/getroommessages', function(req, res, next){

	Model.getRoomMessages(req.body.roomName, function(messages){
		res.send({
			messages : messages
		});
	});

});

router.post('/uploadfile', function(req, res, next){

	var data, fileName, fileStream, uploadedSize;
	var io = req.app.get('io');

	if (req.xhr){
		data = JSON.parse(decodeURIComponent(req.header('X-File-Data')));
		fileName = Date.now().toString() + '-' + HD.Math.rand(100, 999) + '.' + data.fileData.name.split('.').pop();
		fileStream = fs.createWriteStream(appRoot + '/app/public/upload/' + fileName);
		uploadedSize = 0;

		req.on('data', function(file){
			var first = (uploadedSize === 0);
			uploadedSize += file.byteLength;
			io.of('/chat').to(data.roomName).emit('fileReceive', {
				roomName : data.roomName,
				userId : Number.parseInt(data.id),
				uploadedSize : uploadedSize,
				fileSize : Number.parseInt(data.fileData.size),
				firstSend : first
			});
			fileStream.write(file);
		});
		req.on('end', function(){
			res.send({
				filePath : 'upload/' + fileName
			});
		});
	}


});

module.exports = router;
