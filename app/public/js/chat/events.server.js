/* global HD */

"use strict";

var CHAT = window.CHAT || {};
CHAT.Events = CHAT.Events || {};

/**
 * Szerver által küldött események kezelése
 * @type {Object}
 */
CHAT.Events.Server = {

    /**
     * Belépés a chat-be
     * @param {Object} data
     * @description
     * data = {
     *     id : Number,      // user azonosító
     *     name : String,    // user login név
     *     status : String,  // user státusz ("on"|"busy"|"off")
     *     isIdle : Boolean  // user státusz: "idle"
     * }
     */
    userConnected : function(data){
        // CHAT.Method.appendSystemMessage(box, 'connect', data.id);
    },

    /**
     * Kilépés a chat-ből
     * @param {Object} data
     * @description
     * data = {
     *     id : Number,      // user azonosító
     *     name : String,    // user login név
     *     status : String,  // user státusz ("on"|"busy"|"off")
     *     isIdle : Boolean  // user státusz: "idle"
     * }
     */
    disconnect : function(data){
        HD.DOM(CHAT.DOM.box).filter(':not(.cloneable)').elements.forEach(function(box){
            const Box = HD.DOM(box);
            if (Box.find(CHAT.DOM.userItems).filter(`[data-id="${data.id}"]`).elements.length > 0){
                CHAT.Method.appendSystemMessage(box, 'leave', data.id);
                Box.find(`[data-id="${data.id}"]`).remove();
            }
        });
    },

    /**
     * User-ek állapotváltozása
     * @param {Object} connectedUsers
     * @description
     * connectedUsers = {
     *     <socket.id> : {
     *         id : Number,      // user azonosító
     *         name : String,    // user login név
     *         status : String,  // user státusz ("on"|"busy"|"off")
     *         isIdle : Boolean  // user státusz: "idle"
     *     },
     *     ...
     * }
     */
    statusChanged : function(connectedUsers){
        HD.DOM(CHAT.DOM.online).dataObj("connected-users", connectedUsers);
        CHAT.Method.updateStatuses(connectedUsers);
    },

    /**
     * Csatorna létrehozása
     * @param {Object} roomData
     * @description
     * roomData = {
     *     name : String,    // "room-x-y"; x: létrehozó userId, y: létrehozás timestamp
     *     userIds : Array,  // csatornába rakott userId-k
     *     starter : Number  // csatorna létrehozó userId
     * }
     */
    roomCreated : function(roomData){
        let Box, Userlist;

        if (roomData.userIds.indexOf(CHAT.USER.id) > -1){
            Box = HD.DOM(
                CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
            );
            Userlist = Box.find(CHAT.DOM.users);
            Box.data("room", roomData.name);
            CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds);
            CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).dataObj("connected-users"));
            CHAT.socket.emit('roomJoin', {roomName : roomData.name});
            CHAT.Method.notification(Box.elem(), {
                type : "create",
                fromId : roomData.starter,
                local : false
            });
        }
    },

    /**
     * Csatornához csatlakozás (belépés hatására)
     * @param {Object} roomData
     * @description
     * roomData = {
     *     userId : Number,
     *     roomData : Object
     * }
     */
    roomJoined : function(roomData){
        let box, Box, Userlist;

        if (roomData.joinedUserId === CHAT.USER.id){
            // Létre kell hozni a dobozt a csatornához
            Box = HD.DOM(
                CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
            );
            Userlist = Box.find(CHAT.DOM.users);
            Box.data("room", roomData.name);
            CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds);
            CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).dataObj("connected-users"));
            CHAT.Method.fillBox(Box.elem(), roomData.name);
        }
        else {
            // Csatlakozott a csatornához
            Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${roomData.name}"]`);
            box = Box.elem();
            if (box){
                Userlist = Box.find(CHAT.DOM.users);
                CHAT.Method.appendSystemMessage(box, 'join', roomData.joinedUserId);
                CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds, true);
                CHAT.Method.notification(box, {
                    type : "join",
                    fromId : roomData.joinedUserId,
                    local : true
                });
            }
        }
    },

    /**
     * Csatorna elhagyása
     * @param {Object} extData
     * @description
     * extData = {
     *     userId : Number,
     *     roomData : Object
     * }
     */
    roomLeaved : function(extData){
        let box, Box;

        if (extData.roomData){
            Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
            box = Box.elem();
            if (box){
                CHAT.Method.appendSystemMessage(box, 'leave', extData.userId);
                CHAT.Method.notification(box, {
                    type : "leave",
                    fromId : extData.userId,
                    local : true
                });
            }
            Box.find(`[data-id="${extData.userId}"]`).remove();
        }
    },

    /**
     * Hozzáadás csatornához
     * @param {Object} extData
     * @description
     * extData = {
     *     triggerId : Number,
     *     userId : Number,
     *     roomData : Object
     * }
     */
    roomForceJoined : function(extData){
        let box, Box, Userlist;

        Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
        box = Box.elem();

        if (extData.userId === CHAT.USER.id){
            // Csatlakoztattak a csatornához
            if (box){
                // Van a csatornához tartozó doboz (korábban ki lett dobva)
                Userlist = Box.find(CHAT.DOM.users);
                CHAT.Method.changeBoxStatus(box, "enabled");
                CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds, true);
                CHAT.Method.appendSystemMessage(box, 'forceJoinYou', extData.triggerId);
            }
            else {
                // Létre kell hozni a dobozt a csatornához
                Box = HD.DOM(
                    CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
                );
                box = Box.elem();
                Userlist = Box.find(CHAT.DOM.users);
                Box.data("room", extData.roomData.name);
                CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).dataObj("connected-users"));
                CHAT.Method.fillBox(box, extData.roomData.name);
                CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds);
                CHAT.Method.appendSystemMessage(box, 'forceJoinYou', extData.triggerId);
            }
            CHAT.socket.emit('roomJoin', {
                userId : CHAT.USER.id,
                roomName : extData.roomData.name
            });
            CHAT.Method.notification(box, {
                type : "forceJoinYou",
                fromId : extData.triggerId,
                local : false
            });
        }
        else if (box){
            // Új user csatlakozott a csatornához
            Userlist = Box.find(CHAT.DOM.users);
            CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds, true);
            CHAT.Method.appendSystemMessage(box, 'forceJoinOther', extData.triggerId, extData.userId);
            CHAT.Method.notification(box, {
                type : "forceJoinOther",
                fromId : extData.triggerId,
                toId : extData.userId,
                local : true
            });
        }
    },

    /**
     * Kidobás csatornából
     * @param {Object} extData
     * @description
     * extData = {
     *     triggerId : Number,
     *     userId : Number,
     *     roomData : Object
     * }
     */
    roomForceLeaved : function(extData){
        const Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
        const box = Box.elem();

        if (box){
            if (extData.userId === CHAT.USER.id){
                CHAT.Method.appendSystemMessage(box, 'forceLeaveYou', extData.triggerId);
                CHAT.socket.emit('roomLeave', {
                    silent : true,
                    userId : CHAT.USER.id,
                    roomName : extData.roomData.name
                });
                CHAT.Method.changeBoxStatus(box, "disabled");
                CHAT.Method.notification(box, {
                    type : "forceLeaveYou",
                    fromId : extData.triggerId,
                    local : true
                });
            }
            else {
                CHAT.Method.appendSystemMessage(box, 'forceLeaveOther', extData.triggerId, extData.userId);
                CHAT.Method.notification(box, {
                    type : "forceLeaveOther",
                    fromId : extData.triggerId,
                    toId : extData.userId,
                    local : true
                });
            }
            Box.find(`[data-id="${extData.userId}"]`).remove();
        }
    },

    /**
     * Üzenetküldés
     * @param {Object} data
     * @description
     * data = {
     *     userId : Number,
     *     message : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    sendMessage : function(data){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

        if (box){
            CHAT.Method.appendUserMessage(box, data);
            CHAT.Method.stopWrite(box, data.userId, '');
            CHAT.Method.notification(box, {
                type : "message",
                fromId : data.userId,
                local : true
            });
        }
    },

    /**
     * Fájlfogadás folyamata
     * @param {Object} data
     * @description
     * data = {
     *     userId : Number,
     *     roomName : String,
     *     uploadedSize : Number,
     *     fileSize : Number,
     *     firstSend : Boolean
     * }
     */
    fileReceive : function(data){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

        if (CHAT.USER.id !== data.userId && box){
            if (data.firstSend){
                CHAT.Events.Server.barId = CHAT.Method.progressbar(
                    box, "get", data.uploadedSize / data.fileSize, null, false
                );
            }
            else {
                CHAT.Method.progressbar(
                    box, "get", data.uploadedSize / data.fileSize, CHAT.Events.Server.barId, false
                );
            }
        }
    },

    /**
     * Fájlfogadás vége (a fájl átjött)
     * @param {Object} data
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
    sendFile : function(data){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

        if (box){
            CHAT.FileTransfer.action('serverSend', [box, data, function(){
                CHAT.Method.notification(box, {
                    type : "file",
                    fromId : data.userId,
                    local : true
                });
            }]);
            CHAT.Method.stopWrite(box, data.userId, '');
        }
    },

    /**
     * Fájlátvitel megszakítása a fogadó oldalon
     * @param {Object} data
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
    abortFile : function(data){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

        if (box){
            CHAT.Method.progressbar(box, "abort", null, CHAT.Events.Server.barId, false);
        }
    },

    /**
     * Üzenetírás
     * @param {Object} data
     * @description
     * data = {
     *     userId : Number,
     *     message : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    typeMessage : function(data){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();
        const writing = CHAT.timer.writing;

        if (box){
            writing.event = true;
            writing.message = data.message;
            if (!writing.timerID){
                CHAT.Method.stillWrite(box, data.userId);
                writing.timerID = window.setInterval(function(){
                    if (!writing.event){
                        CHAT.Method.stopWrite(box, data.userId, writing.message);
                    }
                    writing.event = false;
                }, writing.interval);
            }
        }
    }

};
