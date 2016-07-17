/* global HD LZMA */

"use strict";

var CHAT = window.CHAT || {};

/**
 *
 * @type {Object}
 */
CHAT.FileTransfer = {

    /**
     *
     * @type {Object.<XMLHttpRequest>}
     */
    XHR : {},

    /**
     * Tömörítés
     * @type {Object}
     */
    LZMA : LZMA,

    /**
     *
     * @type {Object}
     */
    strategies : {

        /**
         * URL tárolása db-ben
         * @type {Object}
         */
        upload : {

            /**
             * Fájlfeltöltés
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {FileReader} reader
             * @param {Blob} rawFile
             * @param {Function} [callback=function(){}]
             * @returns {XMLHttpRequest}
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             */
            clientSend : function(box, data, reader, rawFile, callback){
                const fileData = JSON.stringify(data);
                const barId = CHAT.Method.progressbar(box, "send", 0, null);
                const xhr = new XMLHttpRequest();
                callback = HD.Function.param(callback, function(){});

                xhr.open("POST", "/chat/uploadfile");
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.setRequestHeader('X-File-Data', encodeURIComponent(fileData));
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                xhr.upload.onprogress = function(event){
                    if (event.lengthComputable){
                        const percent = event.loaded / event.total;
                        CHAT.Method.progressbar(box, "send", percent, barId);
                    }
                };
                xhr.onabort = function(){
                    CHAT.Method.progressbar(box, "abort", null, barId);
                    CHAT.socket.emit('abortFile', data);
                };
                xhr.onload = function(){
                    const response = JSON.parse(xhr.responseText);
                    data.file = response.filePath;
                    CHAT.Method.progressbar(box, "send", 1, barId);
                    CHAT.Method.appendFile(box, data, true, callback);
                    CHAT.socket.emit('sendFile', data);
                };
                xhr.send(rawFile);
                CHAT.FileTransfer.XHR[barId] = xhr;
                return xhr;
            },

            /**
             * Fájlfogadás
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Function} [callback=function(){}]
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             */
            serverSend : function(box, data, callback){
                callback = HD.Function.param(callback, function(){});
                CHAT.Method.appendFile(box, data, false, callback);
            },

            /**
             * Korábban feltöltött fájl fogadása
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Object} msgData
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             * msgData = {
             *     _id : ObjectID,
             *     userId : Number,
             *     userName : String,
             *     room : String,
             *     message : String|undefined,
             *     file : Object|undefined {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         mainType : String,
             *         store : String,
             *         data : String,
             *         deleted : Boolean
             *     },
             *     created : String
             * }
             */
            receive : function(box, data, msgData){
                data.file = msgData.file.data;
                if (!data.fileData.deleted){
                    CHAT.Method.appendFile(box, data);
                }
                else {
                    CHAT.Method.appendDeletedFile(box, data);
                }
            }

        },

        /**
         * Base64 kód tárolása db-ben
         * @type {Object}
         */
        base64 : {

            /**
             * Fájlküldés
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {FileReader} reader
             * @param {Blob} rawFile
             * @param {Function} [callback=function(){}]
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             */
            clientSend : function(box, data, reader, rawFile, callback){
                callback = HD.Function.param(callback, function(){});

                data.file = reader.result;
                CHAT.Method.appendFile(box, data, true, callback);
                CHAT.socket.emit('sendFile', data);
            },

            /**
             * Fájlfogadás
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Function} [callback=function(){}]
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             */
            serverSend : function(box, data, callback){
                callback = HD.Function.param(callback, function(){});
                CHAT.Method.appendFile(box, data, false, callback);
            },

            /**
             * Korábban küldött fájl fogadása
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Object} msgData
             * @description
             * data = {
             *     userId : Number,
             *     fileData : {
             *         name : String,
             *         size : Number,
             *         type : String
             *     },
             *     file : String,
             *     store : String,
             *     type : String,
             *     time : Number,
             *     roomName : String
             * }
             * msgData = {
             *     _id : ObjectID,
             *     userId : Number,
             *     userName : String,
             *     room : String,
             *     message : String|undefined,
             *     file : Object|undefined {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         mainType : String,
             *         store : String,
             *         data : String,
             *         deleted : Boolean
             *     },
             *     created : String
             * }
             */
            receive : function(box, data, msgData){
                data.file = msgData.file.data;
                CHAT.Method.appendFile(box, data);
            }

        },

        /**
         * Tömörített base64 kód tárolása db-ben
         * @type {Object}
         */
        zip : {

            /**
             * Fájlküldés
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {FileReader} reader
             * @param {Blob} rawFile
             * @param {Function} [callback=function(){}]
             */
            clientSend : function(box, data, reader, rawFile, callback){
                callback = HD.Function.param(callback, function(){});

                CHAT.FileTransfer.LZMA.compress(reader.result, 1, function(result, error){
                    if (error){
                        console.log(error);
                    }
                    else {
                        data.file = result;
                    }
                    CHAT.Method.appendFile(box, data, true, callback);
                    CHAT.socket.emit('sendFile', data);
                }, function(percent){
                    // TODO: progressbar
                });
            },

            /**
             * Fájlfogadás
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Function} [callback=function(){}]
             */
            serverSend : function(box, data, callback){
                callback = HD.Function.param(callback, function(){});

                CHAT.FileTransfer.LZMA.decompress(data.file, function(result, error){
                    if (error){
                        console.log(error);
                    }
                    else {
                        data.file = result;
                        CHAT.Method.appendFile(box, data, false, callback);
                    }
                }, function(percent){
                    // TODO: progressbar
                });
            },

            /**
             * Korábban küldött fájl fogadása
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Object} msgData
             */
            receive : function(box, data, msgData){
                msgData.fileZip.data.forEach(function(element, index, arr){
                    arr[index] -= 128;
                });
                // FIXME: nem indul el a decompress
                CHAT.FileTransfer.LZMA.decompress(msgData.fileZip, function(file, error){
                    console.log(data);
                    if (error){
                        console.log(error);
                    }
                    else {
                        data.file = file;
                        CHAT.Method.appendFile(box, data);
                    }
                }, function(percent){
                    console.log(percent);
                    // TODO: progressbar
                });
            }

        }

    },

    /**
     *
     * @param {String }operation
     * @param {Array} args
     */
    action : function(operation, args){
        const store = CHAT.Config.fileTransfer.store;

        if (this.strategies[store] && this.strategies[store][operation]){
            return this.strategies[store][operation](...args);
        }
    }

};
