/* global */

'use strict';

const log = require.main.require('../libs/log.js');
const HD = require.main.require('../libs/hd/hd.utility.js');
const HDdt = require.main.require('../libs/hd/hd.datetime.js');

const Model = function(db){

    return {

        /**
         * Összes user lekérdezése
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
        getUser : function(data, callback){
            callback = HD.Function.param(callback, () => {});
            db.collection("chat_users")
                .find({
                    "name" : data.username,
                    "password" : data.password
                })
                .limit(1)
                .toArray()
                .then(function(docs){
                    if (docs.length > 0){
                        callback(docs[0]);
                    }
                    else {
                        callback(false);
                    }
                })
                .catch(function(error){
                    log.error(error);
                });
        }

    };

};

module.exports = Model;
