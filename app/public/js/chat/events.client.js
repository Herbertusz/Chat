/* global HD */

"use strict";

var CHAT = window.CHAT || {};
CHAT.Events = CHAT.Events || {};

/**
 * Kliens által küldött események kezelése
 * @type {Object}
 */
CHAT.Events.Client = {

    /**
     * Csatorna létrehozása
     */
    createRoom : function(){
        const roomData = {
            name : "",
            userIds : [CHAT.USER.id],
            starter : CHAT.USER.id
        };
        const Box = HD.DOM(
            CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
        );
        const Userlist = Box.find(CHAT.DOM.users);

        HD.DOM(CHAT.DOM.online).find(CHAT.DOM.selectedUsers).elements.forEach(function(selectedUser){
            const userId = Number(selectedUser.value);
            roomData.userIds.push(userId);
        });
        CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds);
        roomData.name = `room-${roomData.starter}-${Date.now()}`;
        Box.data("room", roomData.name);
        CHAT.socket.emit('roomCreated', roomData);
    },

    /**
     * Kilépés csatornából
     * @param {HTMLElement} box
     */
    leaveRoom : function(box){
        const Box = HD.DOM(box);
        const roomName = Box.data("room");

        Box.remove();
        CHAT.socket.emit('roomLeave', {
            userId : CHAT.USER.id,
            roomName : roomName
        });
    },

    /**
     * User hozzáadása csatornához
     * @param {HTMLElement} add
     * @param {Number} userId
     */
    forceJoinRoom : function(add, userId){
        const Box = HD.DOM(add).ancestor(CHAT.DOM.box);
        const Userlist = Box.find(CHAT.DOM.users);
        const currentUserIds = [];
        const roomName = Box.data("room");

        Userlist.find(CHAT.DOM.userItems).filter(':not(.cloneable)').elements.forEach(function(user){
            currentUserIds.push(HD.DOM(user).dataNum("id"));
        });
        if (currentUserIds.indexOf(userId) === -1){
            CHAT.Method.generateUserList(Userlist.elem(), [userId]);
            CHAT.socket.emit('roomForceJoin', {
                triggerId : CHAT.USER.id,
                userId : userId,
                roomName : roomName
            });
        }
    },

    /**
     * User kidobása csatornából
     * @param {HTMLElement} close
     */
    forceLeaveRoom : function(close){
        const Close = HD.DOM(close);
        const Box = Close.ancestor(CHAT.DOM.box);
        const User = Close.ancestor(CHAT.DOM.userItems);
        const roomName = Box.data("room");
        const userId = User.dataNum("id");

        if (userId === CHAT.USER.id){
            // kilépés
            Box.remove();
            CHAT.socket.emit('roomLeave', {
                userId : CHAT.USER.id,
                roomName : roomName
            });
        }
        else {
            // másik felhasználó kidobása
            User.remove();
            CHAT.socket.emit('roomForceLeave', {
                triggerId : CHAT.USER.id,
                userId : userId,
                roomName : roomName
            });
        }
    },

    /**
     * Üzenetküldés
     * @param {HTMLElement} box
     */
    sendMessage : function(box){
        const Box = HD.DOM(box);
        const Message = Box.find(CHAT.DOM.textarea);
        const data = {
            userId : CHAT.USER.id,
            message : Message.elem().value,
            time : Math.round(Date.now() / 1000),
            roomName : Box.data("room")
        };

        if (data.message.trim().length > 0){
            CHAT.socket.emit('sendMessage', data);
            CHAT.Method.appendUserMessage(box, data, true);
            CHAT.Util.scrollToBottom(box);
            Box.find(CHAT.DOM.textarea).elem().value = '';
        }
    },

    /**
     * Fájlküldés
     * @param {HTMLElement} box
     * @param {Object} files - FileList objektum
     */
    sendFile : function(box, files){
        const store = CHAT.Config.fileTransfer.store;
        const types = CHAT.Config.fileTransfer.types;
        const allowedTypes = CHAT.Config.fileTransfer.allowedTypes;
        const maxSize = CHAT.Config.fileTransfer.maxSize;

        if (!CHAT.Config.fileTransfer.multiple){
            files = [files[0]];
        }
        else {
            files = Array.from(files);
        }

        const fileCheck = function(fileData, rawFile){
            let i;
            const errors = [];
            if (rawFile.size > maxSize){
                errors.push({
                    type : "fileSize",
                    value : rawFile.size,
                    restrict : maxSize
                });
            }
            for (i in types){
                if (HD.String.createRegExp(types[i]).test(rawFile.type)){
                    fileData.type = i;
                    break;
                }
            }
            if (allowedTypes.indexOf(fileData.type) === -1){
                errors.push({
                    type : "fileType",
                    value : fileData.type,
                    restrict : allowedTypes
                });
            }
            return errors;
        };

        const filePrepare = function(rawFile){
            const fileData = {
                userId : CHAT.USER.id,
                fileData : {
                    name : rawFile.name,
                    size : rawFile.size,
                    type : rawFile.type
                },
                file : null,  // base64
                store : store,
                type : '',
                time : Math.round(Date.now() / 1000),
                roomName : HD.DOM(box).data("room")
            };
            const errors = fileCheck(fileData, rawFile);

            if (errors.length === 0){
                const reader = new FileReader();
                (new Promise(function(resolve){
                    CHAT.Method.progress(box, "show");
                    reader.onload = resolve;
                })).then(function(){
                    CHAT.Method.progress(box, "hide");
                    CHAT.Util.scrollToBottom(box);
                    return CHAT.FileTransfer.action('clientSend', [box, fileData, reader, rawFile, function(){
                        CHAT.Util.scrollToBottom(box);
                    }]);
                });
                reader.readAsDataURL(rawFile);
            }
            else {
                CHAT.Method.showError(box, errors);
            }
        };

        files.forEach(function(rawFile){
            filePrepare(rawFile);
        });
    },

    /**
     * Fájlküldés megszakítása
     * @param {HTMLElement} progressbar
     */
    abortFile : function(progressbar){
        const barId = HD.DOM(progressbar).dataNum("id");
        if (typeof CHAT.FileTransfer.XHR[barId] !== "undefined"){
            CHAT.FileTransfer.XHR[barId].abort();
        }
    },

    /**
     * Gépelés
     * @param {HTMLElement} box
     */
    typeMessage : function(box){
        const Box = HD.DOM(box);
        const Message = Box.find(CHAT.DOM.textarea);
        const data = {
            userId : CHAT.USER.id,
            message : Message.elem().value,
            time : Math.round(Date.now() / 1000),
            roomName : Box.data("room")
        };

        CHAT.socket.emit('typeMessage', data);
    },

    /**
     * Üzenetküldés módjának változtatása
     * @param {HTMLElement} change
     */
    sendMethod : function(change){
        const Change = HD.DOM(change);
        const Box = Change.ancestor(CHAT.DOM.box);

        if (Change.prop("checked")){
            Box.find(CHAT.DOM.sendButton).class("add", "hidden");
        }
        else {
            Box.find(CHAT.DOM.sendButton).class("remove", "hidden");
        }
    }

};
