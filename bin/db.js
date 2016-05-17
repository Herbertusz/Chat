'use strict';

var MongoClient = require('mongodb').MongoClient;
var url = require('../app/models/dbconnect.js');

var createDB = function(db, callback){
	const collectionNum = 2;
	let completed = 0;

	db.createCollection('chat_users');
	db.collection('chat_users').deleteMany({});
	db.collection('chat_users').insertMany([
		{"id" : 1, "username" : "Hörb",    "password" : "x", "created" : new Date("2016-05-14T22:53:00Z")},
		{"id" : 2, "username" : "Dan",     "password" : "x", "created" : new Date("2016-05-14T23:07:00Z")},
		{"id" : 3, "username" : "Pistike", "password" : "x", "created" : new Date("2016-05-14T23:07:00Z")}
	], function(error, result){
		if (error) throw error;
		completed++;
		console.log(`chat_users: ${result.insertedCount}`);
		if (completed === collectionNum){
			callback();
		}
	});

	db.createCollection('chat_messages');
	db.collection('chat_messages').deleteMany({});
	db.collection('chat_messages').insertMany([
		{
			"user_id" : 1,
			"room" : "room-2-1463315399305",
			"file" : null,
			"message" : "Hé, mi a pálya?",
			"created" : new Date("2016-05-15T14:28:08Z")
		}, {
			"user_id" : 1,
			"room" : "room-1-1463315409354",
			"file" : {
				"name" : "parrot.jpg",
				"size" : 124500,
				"type" : "image/jpeg",
				"main_type" : "image",
				"store" : "upload",
				"base64" : "",
				"zip" : [],
				"url" : "/upload/1463315457937-356.jpg",
				"deleted" : true
			},
			"message" : null,
			"created" : new Date("2016-05-15T14:34:27Z")
		}
	], function(error, result){
		if (error) throw error;
		completed++;
		console.log(`chat_users: ${result.insertedCount}`);
		if (completed === collectionNum){
			callback();
		}
	});
};

MongoClient.connect(url, function(error, db){
	if (error) throw error;
	createDB(db, function(){
		db.close();
	});

	/*
	const cursor = db.collection('chat_users').find();
	cursor.forEach(function(doc){
		console.dir(doc);
	}, function(){
		console.log('END');
		db.close();
	});
	*/
});
