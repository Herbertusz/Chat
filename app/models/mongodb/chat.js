/**
 *
 */

'use strict';

const log = require.main.require('../libs/log.js');

/**
 *
 * @param {Object} db
 * @returns {Object}
 * @constructor
 */
const Model = function(db){

    return {

        /**
         * Összes átvitel lekérdezése
         * @param {Array} type
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getMessages : function(type, callback = () => {}){
            const conds = [];
            const types = ['message', 'file', 'event'];
            types.forEach(function(item){
                if (type.indexOf(item) > -1){
                    conds.push({[item] : {'$exists' : true}});
                }
            });

            return db.collection('chat_messages')
                .find({'$or' : conds})
                .sort({'created' : 1})
                .toArray()
                .then(function(messages){
                    callback(messages);
                    return messages;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy csatorna átviteleinek lekérdezése
         * @param {String} roomName
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getRoomMessages : function(roomName, callback = () => {}){
            return db.collection('chat_messages')
                .find({'room' : roomName})
                .sort({'created' : 1})
                .toArray()
                .then(function(messages){
                    const promises = [];
                    messages.forEach(function(message){
                        promises.push(
                            new Promise(function(resolve){
                                db.collection('chat_users')
                                    .find({'id' : message.userId})
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
         * Egy fájl adatainak lekérése csatorna és fájlnév alapján
         * @param {String} roomName
         * @param {String} fileName
         * @param {Function} [callback]
         */
        getFile : function(roomName, fileName, callback = () => {}){
            return db.collection('chat_messages')
                .find({
                    'room' : roomName,
                    'file.data' : fileName
                })
                .toArray()
                .then(function(file){
                    const ret = file || false;
                    callback(ret);
                    return ret;
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
         * @description
         * data = {
         *     // TODO
         * }
         */
        setEvent : function(eventName, roomName, data, callback = () => {}){
            const insertData = {
                'event' : eventName,
                'room' : roomName,
                'data' : data,
                'created' : Date.now()
            };

            return db.collection('chat_messages')
                .insertOne(insertData)
                .then(function(result){
                    const eventId = result.insertedId;
                    callback(eventId);
                    return eventId;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Üzenet beszúrása adatbázisba
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        setMessage : function(data, callback = () => {}){
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
            return db.collection('chat_messages')
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
         * Fájl beszúrása adatbázisba
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     // TODO
         * }
         */
        setFile : function(data, callback = () => {}){
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
         * Egy átvitelhez tartozó fájl töröltre állítása
         * @param {String} filePath
         * @param {Function} [callback]
         * @returns {Promise}
         */
        deleteFile : function(filePath, callback = () => {}){
            return db.collection('chat_messages')
                .find({'$and' : [
                    {'data' : filePath},
                    {'file' : {'$exists' : true}},
                    {'file.store' : 'upload'}
                ]}, {
                    'file' : 1
                })
                .limit(1)
                .toArray()
                .then(function(docs){
                    let url = '';
                    if (docs.length){
                        url = docs[0].file.data;
                        db.collection('chat_messages')
                            .updateOne({
                                '_id' : docs[0]._id
                            }, {
                                '$set' : {
                                    'file.deleted' : true
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
         */
        deleteRoomFiles : function(roomName, callback = () => {}){
            return db.collection('chat_messages')
                .find({'$and' : [
                    {'room' : roomName},
                    {'file' : {'$exists' : true}},
                    {'file.store' : 'upload'}
                ]}, {
                    'file' : 1
                })
                .toArray()
                .then(function(docs){
                    const urls = [];
                    docs.forEach(function(doc){
                        urls.push(doc.file.data);
                        db.collection('chat_messages')
                            .updateOne({
                                '_id' : doc._id
                            }, {
                                '$set' : {
                                    'file.deleted' : true
                                }
                            });
                    });
                    callback(urls);
                    return urls;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Felhasználó utolsó állapotváltozásának lekérdezése
         * @param {Number} userId
         * @param {Function} [callback]
         */
        getLastStatus : function(userId, callback = () => {}){
            return db.collection('chat_statuses')
                .find({'userId' : userId})
                .sort({'created' : -1})
                .limit(1)
                .toArray()
                .then(function(statuses){
                    let status;
                    if (statuses.length === 0){
                        status = {
                            userId : userId,
                            prevStatus : null,
                            nextStatus : null,
                            created : Date.now()
                        };
                    }
                    else {
                        status = statuses[0];
                    }
                    callback(status);
                    return status;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Felhasználó állapotváltozásának eltárolása (időméréshez)
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     userId : Number,
         *     prevStatus : String,
         *     nextStatus : String
         * }
         */
        setStatus : function(data, callback = () => {}){
            const insertData = {
                userId : data.userId,
                prevStatus : data.prevStatus,
                nextStatus : data.nextStatus,
                created : Date.now()
            };

            return db.collection('chat_statuses')
                .deleteMany({'userId' : data.userId})
                .then(function(result){
                    return db.collection('chat_statuses')
                        .insertOne(insertData);
                })
                .then(function(result){
                    const statusId = result.insertedId;
                    callback(statusId);
                    return statusId;
                })
                .catch(function(error){
                    log.error(error);
                });
        }

    };

};

module.exports = Model;
