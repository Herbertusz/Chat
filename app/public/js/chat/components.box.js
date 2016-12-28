/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Chat-dobozok kezelése
 * @type {Object}
 */
CHAT.Components.Box = {

    /**
     * Doboz scrollozása az aljára
     * @param {HTMLElement} box - Chat-doboz
     * @param {Boolean} [conditional=false]
     */
    scrollToBottom : function(box, conditional = false){
        const list = HD.DOM(box).find(CHAT.DOM.list).elem();

        if (conditional){
            if (list.scrollHeight - list.offsetHeight - list.scrollTop < CHAT.Config.notification.local.scroll){
                list.scrollTop = list.scrollHeight;
            }
        }
        else {
            list.scrollTop = list.scrollHeight;
        }
    },

    /**
     * Doboz aktiválása/inaktiválása
     * @param {HTMLElement} box
     * @param {String} newStatus - 'enabled'|'disabled'
     */
    changeStatus : function(box, newStatus){
        const Box = HD.DOM(box);
        if (newStatus === 'enabled'){
            Box.find(CHAT.DOM.textarea).prop('disabled', false);
            Box.find(CHAT.DOM.userThrow).dataBool('disabled', false);
            Box.find(CHAT.DOM.fileTrigger).dataBool('disabled', false);
            Box.dataBool('disabled', false);
        }
        else if (newStatus === 'disabled'){
            Box.find(CHAT.DOM.textarea).prop('disabled', true);
            Box.find(CHAT.DOM.userThrow).dataBool('disabled', true);
            Box.find(CHAT.DOM.fileTrigger).dataBool('disabled', true);
            Box.dataBool('disabled', true);
        }
    },

    /**
     * Doboz kitöltése DB-ből származó adatokkal
     * @param {HTMLElement} box
     * @param {String} roomName
     * @returns {Promise}
     */
    fill : function(box, roomName){

        HD.DOM.ajax({
            method : 'POST',
            url : '/chat/getroommessages',
            data : `roomName=${roomName}`
        }).then(function(resp){
            resp = JSON.parse(resp);
            let sequence = Promise.resolve();
            /**
             * Ajax válasz
             * @type {Object}
             * resp = {
             *     messages : [
             *         0 : {
             *             _id : ObjectID,
             *             userId : Number,
             *             userName : String,
             *             room : String,
             *             message : String|undefined,
             *             file : Object|undefined {
             *                 name : String,
             *                 size : Number,
             *                 type : String,
             *                 mainType : String,
             *                 store : String,
             *                 data : String,
             *                 deleted : Boolean
             *             },
             *             created : String
             *         }
             *     ]
             * }
             */
            resp.messages.forEach(function(msgData){
                sequence = sequence
                    .then(function(){
                        let data;
                        const timestamp = msgData.created;

                        if (HD.Misc.defined(msgData.message)){
                            // szöveges üzenet
                            CHAT.Components.Transfer.appendUserMessage(box, {
                                userId : msgData.userId,
                                time : timestamp,
                                message : msgData.message,
                                roomName : roomName
                            }, msgData.userId === CHAT.userId);
                            return Promise.resolve();
                        }
                        else if (HD.Misc.defined(msgData.file)){
                            // fájlküldés
                            data = {
                                userId : msgData.userId,
                                fileData : {
                                    name : msgData.file.name,
                                    size : msgData.file.size,
                                    type : msgData.file.type,
                                    deleted : msgData.file.deleted
                                },
                                file : null,
                                type : msgData.file.mainType,
                                time : timestamp,
                                roomName : roomName
                            };
                            return CHAT.FileTransfer.action('receive', [box, data, msgData]);
                        }
                        else {
                            // esemény
                            return Promise.resolve();
                        }
                    })
                    .catch(function(error){
                        HD.Log.error(error);
                    });
            });
        });

    }

};
