'use strict';

const ENV = require.main.require('../app/env.js');

const createMongoDB = function(){
    // Adatbázis és user létrehozás:
    // use hdchat
    // db.createUser({ user: "hdchat", pwd: "<password>", roles: [{ role: "dbOwner", db: "hdchat" }] })
    // db.auth("hdchat", "<password>")
    // db.dummy.insert({"name", "hd"})

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
                            'status' : {
                                'prev' : null,
                                'next' : null,
                                'type' : null,
                                'created' : null
                            },
                            'lastActive' : 1469215006264,
                            'created' : 1469215006264,
                            'active' : true
                        },
                        {
                            'id' : 2,
                            'name' : 'Dan',
                            'password' : 'x',
                            'status' : {
                                'prev' : null,
                                'next' : null,
                                'type' : null,
                                'created' : null
                            },
                            'lastActive' : 1469215006264,
                            'created' : 1469215006264,
                            'active' : true
                        },
                        {
                            'id' : 3,
                            'name' : 'Hosszúnevű Gedeon',
                            'password' : 'x',
                            'status' : {
                                'prev' : null,
                                'next' : null,
                                'type' : null,
                                'created' : null
                            },
                            'lastActive' : null,
                            'created' : 1469215006264,
                            'active' : true
                        },
                        {
                            'id' : 4,
                            'name' : 'Pistike',
                            'password' : 'x',
                            'status' : {
                                'prev' : null,
                                'next' : null,
                                'type' : null,
                                'created' : null
                            },
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
                            'event' : 'roomCreated',
                            'triggerId' : 1,
                            'userId' : [1, 2],
                            'room' : 'room-1-1464111818071',
                            'created' : 1469215000832
                        }, {
                            'userId' : 1,
                            'room' : 'room-1-1464111342853',
                            'message' : 'Hé, mi a pálya?',
                            'created' : 1469215006264
                        }, {
                            'userId' : 1,
                            'room' : 'room-1-1464111818071',
                            'file' : {
                                'raw' : {
                                    'name' : '4.jpg',
                                    'size' : 60205,
                                    'type' : 'image/jpeg',
                                    'source' : '1464111822726-805.jpg'
                                },
                                'store' : 'upload',
                                'type' : 'image',
                                'name' : '1464111822726-805.jpg',
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

        // db.createCollection('chat_rooms');
        // db.collection('chat_rooms')
        //     .deleteMany({})
        //     .then(function(){
        //         db.collection('chat_rooms')
        //             .insertMany([
        //                 {
        //                     'name' : 'room-1-1464111818071',
        //                     'userIds' : [1, 2],
        //                     'starter' : 1,
        //                     'created' : 1469215000832
        //                 }
        //             ])
        //             .then(function(result){
        //                 completed++;
        //                 console.log(`chat_rooms: ${result.insertedCount}`);
        //                 if (completed === collectionNum){
        //                     callback();
        //                 }
        //             })
        //             .catch(function(error){
        //                 console.log(error);
        //             });
        //     })
        //     .catch(function(error){
        //         console.log(error);
        //     });
    };

    MongoClient.connect(url, function(error, db){
        if (error) throw error;
        createDB(db, function(){
            db.close();
        });
    });
};

const createMySQL = function(){
    // Adatbázis és user létrehozás:
    // CREATE DATABASE `hdchat` DEFAULT CHARACTER SET utf8;
    // CREATE USER 'hdchat'@'localhost' IDENTIFIED BY '<password>';
    // GRANT ALL PRIVILEGES ON `hdchat`.* TO 'hdchat'@'localhost';

    let db;
    const DB = require.main.require('../libs/mysql.js');
    const dbConnectionString = require.main.require('../app/models/mysql/dbconnect.js');

    DB.connect(dbConnectionString)
        .then(function(dbConnection){
            console.log('Drop tables...');
            db = dbConnection;
            return Promise.all([
                db.query(`DROP TABLE IF EXISTS chat_messages`),
                db.query(`DROP TABLE IF EXISTS chat_messages_events`),
                db.query(`DROP TABLE IF EXISTS chat_messages_files`),
                db.query(`DROP TABLE IF EXISTS chat_messages_texts`),
                db.query(`DROP TABLE IF EXISTS chat_users`)
            ]);
        })
        .then(function(){
            console.log('Create tables...');
            return Promise.all([
                db.query(`
                    CREATE TABLE chat_users (
                        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        name varchar(100) CHARACTER SET utf8 NOT NULL,
                        password varchar(100) CHARACTER SET utf8 NOT NULL,
                        statusPrev varchar(50) CHARACTER SET utf8 DEFAULT NULL,
                        statusNext varchar(50) CHARACTER SET utf8 DEFAULT NULL,
                        statusType tinyint(1) DEFAULT NULL,
                        statusCreated bigint(20) DEFAULT NULL,
                        lastActive bigint(20) DEFAULT NULL,
                        created bigint(20) NOT NULL,
                        active tinyint(1) NOT NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages (
                        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        userId int(11) DEFAULT NULL,
                        room varchar(100) CHARACTER SET utf8 NOT NULL,
                        type varchar(50) CHARACTER SET utf8 NOT NULL,
                        transferId int(11) NOT NULL,
                        created bigint(20) NOT NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_events (
                        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        event varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        triggerId int(11) DEFAULT NOT NULL,
                        userId varchar(100) CHARACTER SET utf8 NOT NULL  -- lehet id-lista is
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_files (
                        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        rawName varchar(200) COLLATE utf8_unicode_ci NOT NULL,
                        rawSize int(11) NOT NULL,
                        rawType varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        rawSource text COLLATE utf8_unicode_ci NOT NULL,
                        store varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        type varchar(50) COLLATE utf8_unicode_ci NOT NULL,
                        name varchar(200) COLLATE utf8_unicode_ci NOT NULL,
                        deleted tinyint(1) NOT NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `),
                db.query(`
                    CREATE TABLE chat_messages_texts (
                        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        message text COLLATE utf8_unicode_ci NOT NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                `)
                // db.query(`
                //     CREATE TABLE chat_rooms (
                //         id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                //         name varchar(100) CHARACTER SET utf8 NOT NULL,
                //         userIds varchar(100) CHARACTER SET utf8 NOT NULL,  -- id-lista
                //         starter int(11) DEFAULT NOT NULL,
                //         created bigint(20) NOT NULL
                //     ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
                // `)
            ]);
        })
        .then(function(){
            console.log('Insert users...');
            return db.query(`
                INSERT INTO
                    chat_users
                    (id, name, password, statusPrev, statusNext, statusType, statusCreated, lastActive, created, active)
                VALUES
                    (1, 'Hörb', 'x', NULL, NULL, NULL, NULL, 1469215006264, 1469215006264, 1),
                    (2, 'Dan', 'x', NULL, NULL, NULL, NULL, 1469215006264, 1469215006264, 1),
                    (3, 'Hosszúnevű Gedeon', 'x', NULL, NULL, NULL, NULL, NULL, 1469215006264, 1),
                    (4, 'Pistike', 'x', NULL, NULL, NULL, NULL, NULL, 1469215006264, 1)
            `);
        })
        .then(function(){
            console.log('Done');
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
