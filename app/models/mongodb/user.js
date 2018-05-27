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
            return db.collection('chat_users')
                .find({
                    'active' : true
                })
                .project({
                    'id' : 1,
                    'name' : 1
                })
                .sort({
                    'name' : 1
                })
                .toArray()
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
            return db.collection('chat_users')
                .find({
                    'name' : data.username,
                    'password' : data.password
                })
                .project({
                    'id' : 1,
                    'name' : 1
                })
                .limit(1)
                .toArray()
                .then(function(user){
                    if (user.length > 0){
                        callback(user[0]);
                        return user[0];
                    }
                    else {
                        callback(false);
                        return false;
                    }
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
            return db.collection('chat_users')
                .find({
                    'id' : {$in : userIds}
                })
                .project({
                    'id' : 1,
                    'name' : 1,
                    'forbidden' : 1
                })
                .toArray()
                .then(function(users){
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
            return db.collection('chat_users')
                .find({
                    'id' : userId
                })
                .limit(1)
                .toArray()
                .then(function(users){
                    let status = null;
                    if (users.length){
                        status = {
                            userId : userId,
                            prevStatus : users[0].status.prev,
                            nextStatus : users[0].status.next,
                            type : users[0].status.type,
                            created : users[0].status.created || Date.now()
                        };
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
         *  data = {
         *      userId : Number,
         *      type : Number,
         *      prevStatus : String,
         *      nextStatus : String
         *  }
         */
        setStatus : function(data, callback = () => {}){
            const status = {
                prev : data.prevStatus,
                next : data.nextStatus,
                type : data.type,
                created : Date.now()
            };

            return db.collection('chat_users')
                .updateOne({
                    id : data.userId
                }, {
                    $set : {status : status}
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
