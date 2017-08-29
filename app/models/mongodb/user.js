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
                .find({'active' : true})
                .sort({'name' : 1})
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
         * data = {
         *     username : String,
         *     password : String
         * }
         */
        getUser : function(data, callback = () => {}){
            return db.collection('chat_users')
                .find({
                    'name' : data.username,
                    'password' : data.password
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
        getUserList : function(userIds, callback = () => {}){
            return db.collection('chat_users')
                .find({'id' : {$in : userIds}})
                .toArray()
                .then(function(users){
                    callback(users);
                    return users;
                })
                .catch(function(error){
                    log.error(error);
                });
        }

    };

};

module.exports = Model;
