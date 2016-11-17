/* global */

'use strict';

var log = require(`../../../libs/log.js`);

var Model = function(db){

    return {

        /**
         * User lekérdezése login-account alapján
         * @param data
         * @param callback
         */
        getUser : function(data, callback){
            return db
                .getrows(`
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
