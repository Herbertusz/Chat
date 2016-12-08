/* global */

'use strict';

const log = require.main.require('../libs/log.js');
const HD = require.main.require('../libs/hd/hd.utility.js');

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
        getMessages : function(type, callback){
            callback = HD.Function.param(callback, () => {});
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
         * @param {String} roomName
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getRoomMessages : function(roomName, callback){
            callback = HD.Function.param(callback, () => {});
            return db.getRows(`
                    SELECT
                        cm.*,
                        cu.name AS userName
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_users cu ON cm.userId = cu.id
                    WHERE
                        cm.room = :roomName
                    ORDER BY
                        cm.created ASC
                `)
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
         * @description
         * data = {
         *     // TODO
         * }
         */
        setEvent : function(eventName, roomName, data, callback){
            callback = HD.Function.param(callback, () => {});
            const time = Date.now();

            return db.query(`
                    INSERT INTO
                        chat_messages_events
                    (
                        type,
                        data
                    ) VALUES (
                        :type,
                        :data
                    )
                `, {
                    'type' : eventName,
                    'data' : JSON.stringify(data)
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
                        'room' : roomName,
                        'id' : result.insertId,
                        'created' : time
                    });
                })
                .then(function(result){
                    callback(result.insertId);
                    return result.insertId;
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
        setMessage : function(data, callback){
            callback = HD.Function.param(callback, () => {});

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
                    callback(result.insertId);
                    return result.insertId;
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
        setFile : function(data, callback){
            callback = HD.Function.param(callback, () => {});

            return db.query(`
                    INSERT INTO
                        chat_messages_files
                    (
                        name,
                        size,
                        type,
                        mainType,
                        store,
                        data,
                        deleted
                    ) VALUES (
                        :name,
                        :size,
                        :type,
                        :mainType,
                        :store,
                        :data,
                        0
                    )
                `, {
                    'name' : data.fileData.name,
                    'size' : data.fileData.size,
                    'type' : data.fileData.type,
                    'mainType' : data.mainType,
                    'store' : data.store,
                    'data' : data.file
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
                        'room' : data.room,
                        'id' : result.insertId,
                        'created' : data.time
                    });
                })
                .then(function(result){
                    callback(result.insertId);
                    return result.insertId;
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Egy átvitelhez tartozó fájl töröltre állítása
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

            return db.getRow(`
                    SELECT
                        cmf.*
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_messages_files cmf ON cm.transferId = cmf.id
                    WHERE
                        cm.type = 'file' AND
                        cmf.store = 'upload' AND
                        cmf.data = :filePath
                    LIMIT
                        1
                `, {
                    'filePath' : filePath
                })
                .then(function(file){
                    let url = '';
                    if (file.id){
                        url = file.data;
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

            return db.getRows(`
                    SELECT
                        cmf.*
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_messages_files cmf ON cm.transferId = cmf.id
                    WHERE
                        cm.type = 'file' AND
                        cmf.store = 'upload' AND
                        cm.room = :roomName
                `, {
                    'roomName' : roomName
                })
                .then(function(files){
                    const urls = [];
                    files.forEach(function(file){
                        urls.push(file.data);
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
