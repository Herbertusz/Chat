/* global HD */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};
var CHAT = (typeof global !== 'undefined' ? global.CHAT : window.CHAT) || {};
if (typeof global !== 'undefined'){
    HD = require('../hd/hd.js')(['utility']);
}

/**
 * Fájlátvitel kezelése
 * @type {Object}
 */
CHAT.FileTransfer = {

    /**
     * Fájlátvitel megszakításához használt segédváltozó
     * @type {Object.<XMLHttpRequest>}
     * @description
     * data = {
     *     <barId> : {XMLHttpRequest}
     * }
     */
    XHR : {},

    /**
     * Fájl ellenőrzése
     * @param {Object} data
     * @param {Object} fileTransferConfig
     * @returns {Array}
     */
    fileCheck : function(data, fileTransferConfig){
        let i;
        const allowed = fileTransferConfig.allowed;
        const types = fileTransferConfig.types;
        const extensions = fileTransferConfig.typeFallback;
        const allowedTypes = fileTransferConfig.allowedTypes;
        const maxSize = fileTransferConfig.maxSize;
        const errors = [];

        if (!allowed){
            errors.push({
                type : 'fileAllowed'
            });
        }
        else {
            if (data.raw.size > maxSize){
                errors.push({
                    type : 'fileSize',
                    value : data.raw.size,
                    restrict : maxSize
                });
            }
            for (i in types){
                if (!(types[i] instanceof RegExp)){
                    types[i] = HD.String.createRegExp(types[i]);
                }
                if (types[i].test(data.raw.type)){
                    data.type = i;
                    break;
                }
            }
            if (data.type === 'file'){
                const ext = data.raw.name.split('.').pop();
                for (i in extensions){
                    if (extensions[i].indexOf(ext) > -1){
                        data.type = i;
                        break;
                    }
                }
            }
            if (allowedTypes.indexOf(data.type) === -1){
                errors.push({
                    type : 'fileType',
                    value : data.type,
                    restrict : allowedTypes
                });
            }
        }

        return errors;
    },

    /**
     * Különböző fájlátviteli módok
     * @type {Object}
     */
    strategies : {

        /**
         * URL tárolása db-ben és fájlfeltöltés
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
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
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
                    CHAT.socket.emit('abortFile', {
                        forced : false,
                        file : data
                    });
                };
                xhr.onload = function(){
                    const response = JSON.parse(xhr.responseText);
                    if (response.success){
                        data.raw.source = response.fileName;
                        CHAT.Components.Transfer.progressbar(box, 'send', 1, barId);
                        CHAT.socket.on('dbFile', function(){
                            CHAT.Components.Transfer.appendFile(box, data, true)
                                .then(callback)
                                .catch(function(error){
                                    HD.Log.error(error);
                                });
                        });
                        CHAT.socket.emit('sendFile', data);
                    }
                    else {
                        CHAT.Components.Transfer.progressbar(box, 'forceAbort', null, barId);
                        CHAT.socket.emit('abortFile', {
                            forced : true,
                            file : data
                        });
                    }
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
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
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
             * @description
             * data = {
             *     userId : Number,
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
             * }
             */
            receive : function(box, data){
                if (!data.deleted){
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
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
             * }
             */
            clientSend : function(box, data, reader, rawFile, callback = () => {}){
                data.raw.source = reader.result;
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
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
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
             * @description
             * data = {
             *     userId : Number,
             *     raw : {
             *         name : String,
             *         size : Number,
             *         type : String,
             *         source : String
             *     },
             *     store : String,
             *     type : String,
             *     time : Number,
             *     room : String,
             *     name : String,
             *     deleted : Boolean
             * }
             */
            receive : function(box, data){
                if (!data.deleted){
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
             */
            receive : function(box, data){
                // TODO
            }

        }

    },

    /**
     * A beállított fájlátviteli mód lefuttatása
     * @param {String} operation
     * @param {Array} args
     */
    action : function(operation, args){
        const store = CHAT.Config.fileTransfer.store;

        if (this.strategies[store] && this.strategies[store][operation]){
            return this.strategies[store][operation](...args);
        }
    }

};

if (typeof exports !== 'undefined'){
    exports.FileTransfer = CHAT.FileTransfer;
}
