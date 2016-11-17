/* global */

'use strict';

var log = require.main.require('../libs/log.js');

var Model = function(db){

    return {

        /**
         * User lekérdezése login-account alapján
         * @param data
         * @param callback
         */
        getUser : function(data, callback){
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
