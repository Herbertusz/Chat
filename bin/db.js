'use strict';

var ENV = require('../app/env.js');
var MongoClient = require('mongodb').MongoClient;
var url = require('../app/models/dbconnect.js');

var createDB = function(db, callback){
    const collectionNum = 2;
    let completed = 0;

    db.createCollection('chat_users');
    db.collection('chat_users')
        .deleteMany({})
        .then(function(){
            db.collection('chat_users')
                .insertMany([
                    {
                        "id" : 1,
                        "name" : "Hörb",
                        "password" : "x",
                        "lastActive" : 1469215006264,
                        "created" : 1469215006264,
                        "active" : true
                    },
                    {
                        "id" : 2,
                        "name" : "Dan",
                        "password" : "x",
                        "lastActive" : 1469215006264,
                        "created" : 1469215006264,
                        "active" : true
                    },
                    {
                        "id" : 3,
                        "name" : "Pistike",
                        "password" : "x",
                        "lastActive" : null,
                        "created" : 1469215006264,
                        "active" : true
                    },
                    {
                        "id" : 4,
                        "name" : "Kristóf",
                        "password" : "x",
                        "lastActive" : null,
                        "created" : 1469215006264,
                        "active" : true
                    },
                    {
                        "id" : 5,
                        "name" : "Richi",
                        "password" : "x",
                        "lastActive" : null,
                        "created" : 1469215006264,
                        "active" : true
                    }
                ])
                .then(function(result){
                    completed++;
                    console.log(`chat_users: ${result.insertedCount}`);
                    if (completed === collectionNum){
                        callback();
                    }
                })
                .catch(function(error){
                    console.log(error);
                });
        }).catch(function(error){
            console.log(error);
        });

    db.createCollection('chat_messages');
    db.collection('chat_messages')
        .deleteMany({})
        .then(function(){
            db.collection('chat_messages')
                .insertMany([
                    {
                        "userId" : 1,
                        "room" : "room-1-1464111342853",
                        "message" : "Hé, mi a pálya?",
                        "created" : 1469215006264
                    }, {
                        "userId" : 1,
                        "room" : "room-1-1464111818071",
                        "file" : {
                            "name" : "4.jpg",
                            "size" : 60205,
                            "type" : "image/jpeg",
                            "mainType" : "image",
                            "store" : "upload",
                            "data" : "upload/1464111822726-805.jpg",
                            "deleted" : false
                        },
                        "created" : 1469215245070
                    }
                ])
                .then(function(result){
                    completed++;
                    console.log(`chat_messages: ${result.insertedCount}`);
                    if (completed === collectionNum){
                        callback();
                    }
                })
                .catch(function(error){
                    console.log(error);
                });
        }).catch(function(error){
            console.log(error);
        });
};

MongoClient.connect(url, function(error, db){
    if (error) throw error;
    createDB(db, function(){
        db.close();
    });
});
