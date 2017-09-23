/**
 *
 */

'use strict';

const HD = require.main.require('../app/public/js/hd/hd.js')(['utility']);
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
                    conds.push(`type = '${item}'`);
                }
            });
            const condition = `(${conds.join(') OR (')})`;

            return db.getRows(`
                    SELECT
                        *
                    FROM
                        chat_messages
                    WHERE
                        ${condition}
                    ORDER BY
                        created ASC
                `)
                .then(function(users){
                    callback(users);
                    return users;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy csatorna átviteleinek lekérdezése
         * @param {String} room
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getRoomMessages : function(room, callback = () => {}){
            return db.getRows(`
                    SELECT
                        cm.*,
                        cu.name AS userName
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_users cu ON cm.userId = cu.id
                    WHERE
                        cm.room = :room
                    ORDER BY
                        cm.created ASC
                `, {
                    'room' : room
                })
                .then(function(messages){
                    const promises = [];
                    messages.forEach(function(message, i){
                        promises.push(
                            new Promise(function(resolve){
                                if (message.type === 'message'){
                                    db.getRow(`
                                        SELECT
                                            message
                                        FROM
                                            chat_messages_texts
                                        WHERE
                                            id = ${message.transferId}
                                    `)
                                    .then(function(details){
                                        message = Object.assign(message, details);
                                        resolve(message);
                                    });
                                }
                                else if (message.type === 'file'){
                                    db.getRow(`
                                        SELECT
                                            rawName, rawSize, rawType, rawSource, store, type, name, deleted
                                        FROM
                                            chat_messages_files
                                        WHERE
                                            id = ${message.transferId}
                                    `)
                                    .then(function(rawDetails){
                                        const details = {
                                            file : {
                                                raw : {
                                                    name : rawDetails.rawName,
                                                    size : rawDetails.rawSize,
                                                    type : rawDetails.rawType,
                                                    source : rawDetails.rawSource
                                                },
                                                store : rawDetails.store,
                                                type : rawDetails.type,
                                                name : rawDetails.name,
                                                deleted : rawDetails.deleted
                                            }
                                        };
                                        message = Object.assign(message, details);
                                        resolve(message);
                                    });
                                }
                                else if (message.type === 'event'){
                                    db.getRow(`
                                        SELECT
                                            event, triggerId, userId
                                        FROM
                                            chat_messages_events
                                        WHERE
                                            id = ${message.transferId}
                                    `)
                                    .then(function(details){
                                        message = Object.assign(message, details);
                                        resolve(message);
                                    });
                                }
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
         * @param {String} room
         * @param {String} fileName
         * @param {Function} [callback]
         */
        getFile : function(room, fileName, callback = () => {}){
            return db.getRow(`
                    SELECT
                        cm.*,
                        cmf.*
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_messages_files cmf ON cm.transferId = cmf.id
                    WHERE
                        cm.room = :room AND
                        cmf.name = :fileName
                `, {
                    'room' : room,
                    'fileName' : fileName
                })
                .then(function(file){
                    let ret = false;
                    if (file){
                        ret = {
                            userId : file.userId,
                            raw : {
                                name : file.rawName,
                                size : file.rawSize,
                                type : file.rawType,
                                source : file.rawSource
                            },
                            store : file.store,
                            type : file.type,
                            time : file.created,
                            room : file.room,
                            name : file.name,
                            deleted : file.deleted
                        };
                    }
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
         * @param {String} room
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         * data = {
         *     triggerId : Number,     // eseményt kiváltó userId
         *     userId : Number|Array,  // eseményt elszenvedő userId(k)
         *     room : String           // csatorna azonosító
         * }
         */
        setEvent : function(eventName, room, data, callback = () => {}){
            const time = Date.now();

            return db.query(`
                    INSERT INTO
                        chat_messages_events
                    (
                        event,
                        triggerId,
                        userId
                    ) VALUES (
                        :event,
                        :triggerId,
                        :userId
                    )
                `, {
                    'event' : eventName,
                    'triggerId' : data.triggerId,
                    'userId' : data.userId
                })
                .then(function(result){
                    return db.query(`
                        INSERT INTO
                            chat_messages
                        (
                            userId,
                            room,
                            type,
                            transferId,
                            created
                        ) VALUES (
                            NULL,
                            :room,
                            'event',
                            :id,
                            :created
                        )
                    `, {
                        'room' : room,
                        'id' : result.insertId,
                        'created' : time
                    });
                })
                .then(function(result){
                    const messageId = result.insertId;
                    callback(messageId);
                    return messageId;
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
         *     userId : Number,   // üzenetet küldő user
         *     room : String,     // csatorna azonosító
         *     message : String,  // üzenet
         *     time : Number      // timestamp
         * }
         */
        setMessage : function(data, callback = () => {}){
            return db.query(`
                    INSERT INTO
                        chat_messages_texts
                    (
                        message
                    ) VALUES (
                        :message
                    )
                `, {
                    'message' : data.message
                })
                .then(function(result){
                    return db.query(`
                        INSERT INTO
                            chat_messages
                        (
                            userId,
                            room,
                            type,
                            transferId,
                            created
                        ) VALUES (
                            :userId,
                            :room,
                            'message',
                            :id,
                            :created
                        )
                    `, {
                        'userId' : data.userId,
                        'room' : data.room,
                        'id' : result.insertId,
                        'created' : data.time
                    });
                })
                .then(function(result){
                    const messageId = result.insertId;
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
         *     userId : Number,
         *     file = {
         *         userId : Number,
         *         raw : {
         *             name : String,
         *             size : Number,
         *             type : String,
         *             source : String
         *         },
         *         store : String,
         *         type : String,
         *         time : Number,
         *         room : String,
         *         name : String,
         *         deleted : Boolean
         *     }
         * }
         */
        setFile : function(data, callback = () => {}){
            return db.query(`
                    INSERT INTO
                        chat_messages_files
                    (
                        rawName,
                        rawSize,
                        rawType,
                        rawSource,
                        store,
                        type,
                        name,
                        deleted
                    ) VALUES (
                        :rawName,
                        :rawSize,
                        :rawType,
                        :rawSource,
                        :store,
                        :type,
                        :name,
                        0
                    )
                `, {
                    'rawName' : data.file.raw.name,
                    'rawSize' : data.file.raw.size,
                    'rawType' : data.file.raw.type,
                    'rawSource' : data.file.raw.source,
                    'store' : data.file.store,
                    'type' : data.file.type,
                    'name' : data.file.name
                })
                .then(function(result){
                    return db.query(`
                        INSERT INTO
                            chat_messages
                        (
                            userId,
                            room,
                            type,
                            transferId,
                            created
                        ) VALUES (
                            :userId,
                            :room,
                            'file',
                            :id,
                            :created
                        )
                    `, {
                        'userId' : data.userId,
                        'room' : data.file.room,
                        'id' : result.insertId,
                        'created' : data.file.time
                    });
                })
                .then(function(result){
                    const messageId = result.insertId;
                    callback(messageId);
                    return messageId;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy átvitelhez tartozó fájl töröltre állítása
         * @param {String} fileName
         * @param {Function} [callback]
         * @returns {Promise}
         */
        deleteFile : function(fileName, callback = () => {}){
            return db.getRow(`
                    SELECT
                        cmf.*
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_messages_files cmf ON cm.transferId = cmf.id
                    WHERE
                        cm.type = 'file' AND
                        cmf.store = 'upload' AND
                        cmf.data = :fileName
                    LIMIT
                        1
                `, {
                    'fileName' : fileName
                })
                .then(function(file){
                    let url = '';
                    if (file.id){
                        url = file.name;
                        db.query(`
                            UPDATE
                                chat_messages_files
                            SET
                                deleted = 1
                            WHERE
                                id = :id
                        `, {
                            'id' : file.id
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
         * @param {String} room
         * @param {Function} [callback]
         * @returns {Promise}
         */
        deleteRoomFiles : function(room, callback = () => {}){
            return db.getRows(`
                    SELECT
                        cmf.*
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_messages_files cmf ON cm.transferId = cmf.id
                    WHERE
                        cm.type = 'file' AND
                        cmf.store = 'upload' AND
                        cm.room = :room
                `, {
                    'room' : room
                })
                .then(function(files){
                    const urls = [];
                    files.forEach(function(file){
                        urls.push(file.name);
                        db.query(`
                            UPDATE
                                chat_messages_files
                            SET
                                deleted = 1
                            WHERE
                                id = :id
                        `, {
                            'id' : file.id
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
