/* global */

'use strict';

var log = require.main.require('../libs/log.js');
var HD = require.main.require('../libs/hd/hd.utility.js');
var HDdt = require.main.require('../libs/hd/hd.datetime.js');

/**
 *
 * @param {Object} db
 * @returns {Object}
 * @constructor
 */
var Model = function(db){

    return {

        /**
         * User-ek lekérdezése
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getUsers : function(callback){
            callback = HD.Function.param(callback, () => {});
            return db.collection("chat_users")
                .find({"active" : true})
                .sort({"name" : 1})
                .toArray()
                .then(function(users){
                    users.forEach(function(user, i){
                        users[i].created = HDdt.DateTime.formatMS('Y-m-d H:i:s', user.created);
                    });
                    callback(users);
                    return users;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy csatorna üzeneteinek lekérdezése
         * @param {String} roomName
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getRoomMessages : function(roomName, callback){
            callback = HD.Function.param(callback, () => {});
            return db.collection("chat_messages")
                .find({"room" : roomName})
                .sort({"created" : 1})
                .toArray()
                .then(function(messages){
                    const promises = [];
                    messages.forEach(function(message){
                        promises.push(
                            new Promise(function(resolve){
                                db.collection("chat_users")
                                    .find({"id" : message.userId})
                                    .limit(1)
                                    .toArray()
                                    .then(function(users){
                                        message.userName = users.length ? users[0].name : '';
                                        resolve(message);
                                    });
                            })
                        );
                    });
                    return Promise.all(promises);
                })
                .then(function(messages){
                    callback(messages);
                    return messages;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Esemény beszúrása adatbázisba
         * @param {String} eventName
         * @param {String} roomName
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         */
        setEvent : function(eventName, roomName, data, callback){
            callback = HD.Function.param(callback, () => {});
            const insertData = {
                event : eventName,
                room : roomName,
                created : Date.now(),
                data : data
            };

            return db.collection("chat_messages")
                .insertOne(insertData)
                .then(function(result){
                    const docId = result.insertedId;
                    callback(docId);
                    return docId;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Üzenet beszúrása csatornába
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        setMessage : function(data, callback){
            callback = HD.Function.param(callback, () => {});
            let insertData;

            if (data.message){
                insertData = {
                    'userId' : data.userId,
                    'room' : data.room,
                    'message' : data.message,
                    'created' : data.time
                };
            }
            else if (data.file){
                insertData = data;
            }
            return db.collection("chat_messages")
                .insertOne(insertData)
                .then(function(result){
                    const messageId = result.insertedId;
                    callback(messageId);
                    return messageId;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Fájl típusú üzenet beszúrása csatornába
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        setFile : function(data, callback){
            callback = HD.Function.param(callback, () => {});
            return this.setMessage({
                'userId' : data.userId,
                'room' : data.room,
                'file' : {
                    'name' : data.fileData.name,
                    'size' : data.fileData.size,
                    'type' : data.fileData.type,
                    'mainType' : data.mainType,
                    'store' : data.store,
                    'data' : data.file,
                    'deleted' : false
                },
                'created' : data.time
            }, function(messageId){
                callback(messageId);
            });
        },

        /**
         * Egy üzenethez tartozó fájl töröltre állítása
         * @param {String} filePath
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        deleteFile : function(filePath, callback){
            callback = HD.Function.param(callback, () => {});
            return db.collection("chat_messages")
                .find({"$and" : [
                    {"data" : filePath},
                    {"file" : {"$exists" : true}},
                    {"file.store" : "upload"}
                ]}, {
                    "file" : 1
                })
                .limit(1)
                .toArray()
                .then(function(docs){
                    let url = '';
                    if (docs.length){
                        url = docs[0].file.data;
                        db.collection("chat_messages")
                            .updateOne({
                                "_id" : docs[0]._id
                            }, {
                                "$set" : {
                                    "file.deleted" : true
                                }
                            });
                    }
                    callback(url);
                    return url;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy csatornához tartozó fájlok töröltre állítása
         * @param {String} roomName
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        deleteRoomFiles : function(roomName, callback){
            callback = HD.Function.param(callback, () => {});
            return db.collection("chat_messages")
                .find({"$and" : [
                    {"room" : roomName},
                    {"file" : {"$exists" : true}},
                    {"file.store" : "upload"}
                ]}, {
                    "file" : 1
                })
                .toArray()
                .then(function(docs){
                    const urls = [];
                    docs.forEach(function(doc){
                        urls.push(doc.file.data);
                        db.collection("chat_messages")
                            .updateOne({
                                "_id" : doc._id
                            }, {
                                "$set" : {
                                    "file.deleted" : true
                                }
                            });
                    });
                    callback(urls);
                    return urls;
                })
                .catch(function(error){
                    log.error(error);
                });
        }

    };

};

module.exports = Model;
