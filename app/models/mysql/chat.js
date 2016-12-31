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
        getRoomMessages : function(roomName, callback = () => {}){
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
         * Egy fájl adatainak lekérése csatorna és fájlnév alapján
         * @param {String} roomName
         * @param {String} fileName
         * @param {Function} [callback]
         */
        getFile : function(roomName, fileName, callback = () => {}){
            return db.getRow(`
                    SELECT
                        cm.*,
                        cu.name AS userName
                    FROM
                        chat_messages cm
                        LEFT JOIN chat_files cf ON cm.transferId = cf.id
                    WHERE
                        cm.room = :roomName AND
                        cf.data = :fileName
                `)
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
        setFile : function(data, callback = () => {}){
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
         */
        deleteFile : function(filePath, callback = () => {}){
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
         */
        deleteRoomFiles : function(roomName, callback = () => {}){
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
                    const messageId = result.insertedId;
                    callback(messageId);
                    return messageId;
                })
                .catch(function(error){
                    log.error(error);
                });
        }

    };

};

module.exports = Model;
