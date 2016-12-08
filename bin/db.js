'use strict';

const ENV = require.main.require('../app/env.js');

const createMongoDB = function(){
    const MongoClient = require('mongodb').MongoClient;
    const url = require.main.require('../app/models/mongodb/dbconnect.js');

    const createDB = function(db, callback){
        const collectionNum = 2;
        let completed = 0;

        db.createCollection('chat_users');
        db.collection('chat_users')
            .deleteMany({})
            .then(function(){
                db.collection('chat_users')
                    .insertMany([
                        {
                            'id' : 1,
                            'name' : 'Hörb',
                            'password' : 'x',
                            'lastActive' : 1469215006264,
                            'created' : 1469215006264,
                            'active' : true
                        },
                        {
                            'id' : 2,
                            'name' : 'Dan',
                            'password' : 'x',
                            'lastActive' : 1469215006264,
                            'created' : 1469215006264,
                            'active' : true
                        },
                        {
                            'id' : 3,
                            'name' : 'Pistike',
                            'password' : 'x',
                            'lastActive' : null,
                            'created' : 1469215006264,
                            'active' : true
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
            })
            .catch(function(error){
                console.log(error);
            });

        db.createCollection('chat_messages');
        db.collection('chat_messages')
            .deleteMany({})
            .then(function(){
                db.collection('chat_messages')
                    .insertMany([
                        {
                            'userId' : 1,
                            'room' : 'room-1-1464111342853',
                            'message' : 'Hé, mi a pálya?',
                            'created' : 1469215006264
                        }, {
                            'userId' : 1,
                            'room' : 'room-1-1464111818071',
                            'file' : {
                                'name' : '4.jpg',
                                'size' : 60205,
                                'type' : 'image/jpeg',
                                'mainType' : 'image',
                                'store' : 'upload',
                                'data' : 'upload/1464111822726-805.jpg',
                                'deleted' : false
                            },
                            'created' : 1469215245070
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
            })
            .catch(function(error){
                console.log(error);
            });
    };

    MongoClient.connect(url, function(error, db){
        if (error) throw error;
        createDB(db, function(){
            db.close();
        });
    });
};

const createMySQL = function(){
    // adatbázis létrehozás: 'CREATE DATABASE `chat` DEFAULT CHARACTER SET utf8'

    const DB = require.main.require('../libs/mysql.js');
    const dbConnectionString = require.main.require('../app/models/mysql/dbconnect.js');
    DB.connect(dbConnectionString)
        .then(function(db){
            Promise.all([
                db.query(`
                    CREATE TABLE chat_messages (
                        id int(11) NOT NULL,
                        userId int(11) DEFAULT NULL,
                        room varchar(100) CHARACTER SET utf8 NOT NULL,
                        type varchar(20) CHARACTER SET utf8 NOT NULL,
                        transferId int(11) NOT NULL,
                        created bigint(20) NOT NULL,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_events (
                        id int(11) NOT NULL,
                        type varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        data text COLLATE utf8_unicode_ci NOT NULL,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_files (
                        id int(11) NOT NULL,
                        name varchar(200) COLLATE utf8_unicode_ci NOT NULL,
                        size int(11) NOT NULL,
                        type varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        mainType varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        store varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        data text COLLATE utf8_unicode_ci NOT NULL,
                        deleted tinyint(1) NOT NULL,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_texts (
                        id int(11) NOT NULL,
                        message text COLLATE utf8_unicode_ci NOT NULL,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_users (
                        id int(11) NOT NULL,
                        name varchar(100) CHARACTER SET utf8 NOT NULL,
                        password varchar(100) CHARACTER SET utf8 NOT NULL,
                        lastActive bigint(20) DEFAULT NULL,
                        created bigint(20) NOT NULL,
                        active tinyint(1) NOT NULL,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    INSERT INTO
                        chat_users
                        (id, name, password, lastActive, created, active)
                    VALUES
                        (1, 'Hörb', 'x', 1469215006264, 1469215006264, 1),
                        (2, 'Dan', 'x', 1469215006264, 1469215006264, 1),
                        (3, 'Pistike', 'x', NULL, 1469215006264, 1)
                `)
            ]);
            return db;
        })
        .then(function(db){
            db.close();
        })
        .catch(function(error){
            console.log(error);
        });
};

if (ENV.DBDRIVER === 'mongodb'){
    createMongoDB();
}
else if (ENV.DBDRIVER === 'mysql'){
    createMySQL();
}
