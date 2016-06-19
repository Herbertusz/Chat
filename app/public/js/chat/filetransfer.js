/* global LZMA */

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
         *
         * @type {Object}
         */
        upload : {

            /**
             * Fájlfeltöltés, url tárolása db-ben
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {FileReader} reader
             * @param {Object} rawFile
             * @returns {XMLHttpRequest}
             * @description data szerkezete: {
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
            clientSend : function(box, data, reader, rawFile){
                const fileData = JSON.stringify(data);
                const barId = CHAT.Method.progressbar(box, "send", 0, null);
                const xhr = new XMLHttpRequest();
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
                    CHAT.Method.appendFile(box, data, true);
                    CHAT.socket.emit('sendFile', data);
                };
                xhr.send(rawFile);
                CHAT.FileTransfer.XHR[barId] = xhr;
                return xhr;
            },

            /**
             *
             * @param {HTMLElement} box
             * @param {Object} data
             * @description data szerkezete: {
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
            serverSend : function(box, data){
                CHAT.Method.appendFile(box, data);
            },

            /**
             *
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Object} msgData
             * @description data szerkezete: {
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
         * @type Object
         */
        base64 : {

            /**
             * Fájlküldés
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {FileReader} reader
             * @param {Object} rawFile
             */
            clientSend : function(box, data, reader, rawFile){
                data.file = reader.result;
                CHAT.Method.appendFile(box, data, true);
                CHAT.socket.emit('sendFile', data);
            },

            /**
             * Fájlfogadás
             * @param {HTMLElement} box
             * @param {Object} data
             */
            serverSend : function(box, data){
                CHAT.Method.appendFile(box, data);
            },

            /**
             * Korábban küldött fájl fogadása
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Object} msgData
             */
            receive : function(box, data, msgData){
                data.file = msgData.fileBase64;
                CHAT.Method.appendFile(box, data);
            }

        },

        /**
         *
         * @type Object
         */
        zip : {

            /**
             * Tömörített base64 kód tárolása db-ben
             * @param {HTMLElement} box
             * @param {Object}data
             * @param {FileReader} reader
             * @param {Object} rawFile
             */
            clientSend : function(box, data, reader, rawFile){
                CHAT.FileTransfer.LZMA.compress(reader.result, 1, function(result, error){
                    if (error){
                        console.log(error);
                    }
                    else {
                        data.file = result;
                    }
                    CHAT.Method.appendFile(box, data, true);
                    CHAT.socket.emit('sendFile', data);
                }, function(percent){
                    // TODO: progressbar
                });
            },

            /**
             *
             * @param {HTMLElement} box
             * @param {Object} data
             */
            serverSend : function(box, data){
                CHAT.FileTransfer.LZMA.decompress(data.file, function(result, error){
                    if (error){
                        console.log(error);
                    }
                    else {
                        data.file = result;
                        CHAT.Method.appendFile(box, data);
                    }
                }, function(percent){
                    // TODO: progressbar
                });
            },

            /**
             *
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
