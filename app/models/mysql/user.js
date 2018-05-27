/**
 *
 */

'use strict';

const log = require.main.require('../libs/log.js');

const Model = function(db){

    return {

        /**
         * Összes user lekérdezése
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getUsers : function(callback = () => {}){
            return db.getRows(`
                    SELECT
                        *
                    FROM
                        chat_users
                    WHERE
                        active = 1
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
         * User lekérdezése login-account alapján
         * @param {Object} data
         * @param {Function} [callback]
         * @returns {Promise}
         * @description
         *  data = {
         *      username : String,
         *      password : String
         *  }
         */
        getUser : function(data, callback = () => {}){
            return db.getRows(`
                    SELECT
                        id,
                        name
                    FROM
                        chat_users
                    WHERE
                        name = :username AND
                        password = :password
                    LIMIT
                        1
                `, data)
                .then(function(rows){
                    if (rows.length > 0){
                        callback(rows[0]);
                    }
                    else {
                        callback(false);
                    }
                    return rows[0];
                })
                .catch(function(error){
                    log.error(error);
                });
        },

        /**
         * Userek lekérdezése id-lista alapján
         * @param {Array} userIds
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getUserForbiddens : function(userIds, callback = () => {}){
            return db.getRows(`
                    SELECT
                        id,
                        name,
                        (
                            SELECT
                                GROUP_CONCAT(toUserId SEPARATOR ',')
                            FROM
                                chat_users_forbiddens
                            WHERE
                                fromUserId = chat_users.id
                        ) AS forbiddenList
                    FROM
                        chat_users
                    WHERE
                        id IN (${userIds})
                    ORDER BY
                        created ASC
                `)
                .then(function(users){
                    users.forEach(function(user, i){
                        users[i].forbidden =
                            user.forbiddenList ? user.forbiddenList.split(',').map(id => Number(id)) : [];
                    });
                    callback(users);
                    return users;
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
        getStatus : function(userId, callback = () => {}){
            return db.getRow(`
                    SELECT
                        *
                    FROM
                        chat_users
                    WHERE
                        id = :userId
                    LIMIT
                        1
                `, {
                    'userId' : userId
                })
                .then(function(user){
                    const status = {
                        userId : userId,
                        prevStatus : user.statusPrev,
                        nextStatus : user.statusNext,
                        type : user.statusType,
                        created : user.statusCreated || Date.now()
                    };
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
         *  data = {
         *      userId : Number,
         *      type : Number,
         *      prevStatus : String,
         *      nextStatus : String
         *  }
         */
        setStatus : function(data, callback = () => {}){
            const status = {
                statusPrev : data.prevStatus,
                statusNext : data.nextStatus,
                statusType : data.type,
                statusCreated : Date.now()
            };

            return db.query(`
                    UPDATE
                        chat_users
                    SET
                        statusPrev = :statusPrev,
                        statusNext = :statusNext,
                        statusType = :statusType,
                        statusCreated = :statusCreated
                    WHERE
                        id = :userId
                `, Object.assign(status, {
                    userId : data.userId
                }))
                .then(function(result){
                    const statusId = result.insertId;
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
