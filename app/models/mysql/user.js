/* global */

'use strict';

var log = require.main.require('../libs/log.js');
var HD = require.main.require('../libs/hd/hd.utility.js');

var Model = function(db){

    return {

        /**
         * Összes user lekérdezése
         * @param {Function} [callback]
         * @returns {Promise}
         */
        getUsers : function(callback){
            callback = HD.Function.param(callback, () => {});
            return db
                .getRows(`
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
         * data = {
         *     username : String,
         *     password : String
         * }
         */
        getUser : function(data, callback){
            callback = HD.Function.param(callback, () => {});
            return db
                .getRows(`
                    SELECT
                        *
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
        }

    };

};

module.exports = Model;
