/* global HD */

'use strict';

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
             *     roomName : String,
             *     fileName : String
             * }
             */
            clientSend : function(box, data, reader, rawFile, callback = () => {}){
                const fileData = JSON.stringify(data);
                const barId = CHAT.Components.Transfer.progressbar(box, 'send', 0, null);
                const xhr = new XMLHttpRequest();

                xhr.open('POST', '/chat/uploadfile');
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.setRequestHeader('X-File-Data', encodeURIComponent(fileData));
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                xhr.upload.onprogress = function(event){
                    if (event.lengthComputable){
                        const percent = event.loaded / event.total;
                        CHAT.Components.Transfer.progressbar(box, 'send', percent, barId);
                    }
                };
                xhr.onabort = function(){
                    CHAT.Components.Transfer.progressbar(box, 'abort', null, barId);
                    CHAT.socket.emit('abortFile', data);
                };
                xhr.onload = function(){
                    const response = JSON.parse(xhr.responseText);
                    data.file = response.filePath;
                    CHAT.Components.Transfer.progressbar(box, 'send', 1, barId);
                    CHAT.Components.Transfer.appendFile(box, data, true)
                        .then(callback)
                        .catch(function(error){
                            HD.Log.error(error);
                        });
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
             *     roomName : String,
             *     fileName : String
             * }
             */
            serverSend : function(box, data, callback = () => {}){
                CHAT.Components.Transfer.appendFile(box, data, false)
                    .then(callback)
                    .catch(function(error){
                        HD.Log.error(error);
                    });
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
             *     roomName : String,
             *     fileName : String
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
                    return CHAT.Components.Transfer.appendFile(box, data);
                }
                else {
                    return Promise.resolve();
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
             *     roomName : String,
             *     fileName : String
             * }
             */
            clientSend : function(box, data, reader, rawFile, callback = () => {}){
                data.file = reader.result;
                CHAT.Components.Transfer.appendFile(box, data, true)
                    .then(callback)
                    .catch(function(error){
                        HD.Log.error(error);
                    });
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
             *     roomName : String,
             *     fileName : String
             * }
             */
            serverSend : function(box, data, callback = () => {}){
                CHAT.Components.Transfer.appendFile(box, data, false)
                    .then(callback)
                    .catch(function(error){
                        HD.Log.error(error);
                    });
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
             *     roomName : String,
             *     fileName : String
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
                    return CHAT.Components.Transfer.appendFile(box, data);
                }
                else {
                    return Promise.resolve();
                }
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
            clientSend : function(box, data, reader, rawFile, callback = () => {}){
                // TODO
            },

            /**
             * Fájlfogadás
             * @param {HTMLElement} box
             * @param {Object} data
             * @param {Function} [callback=function(){}]
             */
            serverSend : function(box, data, callback = () => {}){
                // TODO
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

                // TODO
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
