/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Events = CHAT.Events || {};

/**
 * Szerver által küldött események kezelése
 * @type {Object}
 */
CHAT.Events.Server = {

    /**
     * Belépés a chat-be
     * @param {Object} userData
     * @description
     * userData = {
     *     id : Number,      // user azonosító
     *     name : String,    // user login név
     *     status : String,  // user státusz ('on'|'busy'|'off')
     *     isIdle : Boolean  // user státusz: 'idle'
     * }
     */
    userConnected : function(userData){
        // CHAT.Methods.appendSystemMessage(box, 'connect', userData.id);
    },

    /**
     * Kilépés a chat-ből
     * @param {Object} userData
     * @description
     * userData = {
     *     id : Number,      // user azonosító
     *     name : String,    // user login név
     *     status : String,  // user státusz ('on'|'busy'|'off')
     *     isIdle : Boolean  // user státusz: 'idle'
     * }
     */
    disconnect : function(userData){
        HD.DOM(CHAT.DOM.box).filter(':not(.cloneable)').elements.forEach(function(box){
            const Box = HD.DOM(box);
            if (Box.descendants(CHAT.DOM.userItems).filter(`[data-id="${userData.id}"]`).elements.length > 0){
                CHAT.Components.Transfer.appendSystemMessage(box, 'leave', userData.id);
                Box.descendants(`[data-id="${userData.id}"]`).remove();
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
     *         status : String,  // user státusz ('on'|'busy'|'off')
     *         isIdle : Boolean  // user státusz: 'idle'
     *     },
     *     ...
     * }
     */
    statusChanged : function(connectedUsers){
        CHAT.State.connectedUsers = connectedUsers;
        CHAT.Components.User.updateStatuses(connectedUsers);
    },

    /**
     * Csatorna létrehozása/megváltozása
     * @param {Object} changeData
     * @description
     * csatorna létrehozás:
     * changeData = {
     *     operation : String,   // művelet a csatornával ('create'|'delete')
     *     roomData : {
     *         name : String,    // 'room-x-y'; x: létrehozó userId, y: létrehozás timestamp
     *         userIds : Array,  // csatornába rakott userId-k
     *         starter : Number  // csatorna létrehozó userId
     *     }
     * }
     * csatorna módosítás:
     * changeData = {
     *     operation : String,   // művelet egy user-rel ('add'|'remove')
     *     room : String,        // csatorna azonosító
     *     userId : Number       // érintett userId
     * }
     */
    roomUpdate : function(changeData){
        if (changeData.operation === 'create'){
            CHAT.State.rooms.push(changeData.roomData);
        }
        else if (changeData.operation === 'delete'){
            const roomIndex = CHAT.State.rooms.findIndex(function(room){
                return changeData.roomData.name === room.name;
            });
            if (roomIndex > -1){
                CHAT.State.rooms.splice(roomIndex, 1);
            }
        }
        else {
            CHAT.Components.Box.roomUpdate(...HD.Object.iterable(changeData));
        }
    },

    /**
     * Csatorna létrehozása
     * @param {Object} roomData
     * @description
     * roomData = {
     *     name : String,    // 'room-x-y'; x: létrehozó userId, y: létrehozás timestamp
     *     userIds : Array,  // csatornába rakott userId-k
     *     starter : Number  // csatorna létrehozó userId
     * }
     */
    roomCreated : function(roomData){
        let Box, Userlist;

        if (roomData.userIds.indexOf(CHAT.userId) > -1){
            Box = HD.DOM(
                HD.DOM(CHAT.DOM.cloneBox).copyPaste(HD.DOM(CHAT.DOM.container).elem())
            );
            Userlist = Box.descendants(CHAT.DOM.users);

            Box.css({
                width : `${CHAT.Config.box.defaultSize.width}px`,
                height : `${CHAT.Config.box.defaultSize.height}px`
            });
            Box.data('room', roomData.name);
            CHAT.Components.User.generateList(Userlist.elem(), roomData.userIds);
            CHAT.Components.User.updateStatuses(CHAT.State.connectedUsers);
            CHAT.socket.emit('roomJoin', {
                triggerId : CHAT.userId,
                userId : CHAT.userId,
                room : roomData.name
            });
            CHAT.Components.Notification.trigger(Box.elem(), {
                type : 'create',
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
     *     name : String,         // 'room-x-y'; x: létrehozó userId, y: létrehozás timestamp
     *     userIds : Array,       // csatornába rakott userIdk
     *     starter : Number       // csatorna létrehozó userId
     *     joinedUserId : Number  // most csatlakozott userId
     * }
     */
    roomJoined : function(roomData){
        let box, Box, Userlist;

        if (roomData.joinedUserId === CHAT.userId){
            // Létre kell hozni a dobozt a csatornához (a bejelentkezett user-nél fut le)
            Box = HD.DOM(
                HD.DOM(CHAT.DOM.cloneBox).copyPaste(HD.DOM(CHAT.DOM.container).elem())
            );
            Userlist = Box.descendants(CHAT.DOM.users);

            Box.css({
                width : `${CHAT.Config.box.defaultSize.width}px`,
                height : `${CHAT.Config.box.defaultSize.height}px`
            });
            Box.data('room', roomData.name);
            CHAT.Components.User.generateList(Userlist.elem(), roomData.userIds);
            CHAT.Components.User.updateStatuses(CHAT.State.connectedUsers);
            CHAT.Components.Box.fill(Box.elem(), roomData.name);
        }
        else {
            // Értesítést kell küldeni (a többi user-nél fut le)
            Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${roomData.name}"]`);
            box = Box.elem();
            if (box){
                Userlist = Box.descendants(CHAT.DOM.users);
                CHAT.Components.Transfer.appendSystemMessage(box, 'join', roomData.joinedUserId);
                CHAT.Components.User.generateList(Userlist.elem(), roomData.userIds, true);
                CHAT.Components.Notification.trigger(box, {
                    type : 'join',
                    fromId : roomData.joinedUserId,
                    local : true
                });
            }
        }
    },

    /**
     * Csatorna elhagyása
     * @param {Object} eventData
     * @description
     * eventData = {
     *     triggerId : Number,
     *     userId : Number,
     *     room : String,
     *     roomData : Object
     * }
     */
    roomLeaved : function(eventData){
        let box, Box;

        if (eventData.roomData){
            Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${eventData.room}"]`);
            box = Box.elem();
            if (box){
                CHAT.Components.Transfer.appendSystemMessage(box, 'leave', eventData.userId);
                CHAT.Components.Notification.trigger(box, {
                    type : 'leave',
                    fromId : eventData.userId,
                    local : true
                });
            }
            Box.descendants(`[data-id="${eventData.userId}"]`).remove();
        }
    },

    /**
     * Hozzáadás csatornához
     * @param {Object} eventData
     * @description
     * eventData = {
     *     triggerId : Number,
     *     userId : Number,
     *     room : String,
     *     roomData : Object
     * }
     */
    roomForceJoined : function(eventData){
        let box, Box, Userlist;

        Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${eventData.room}"]`);
        box = Box.elem();

        if (eventData.userId === CHAT.userId){
            // Csatlakoztattak a csatornához
            if (box){
                // Van a csatornához tartozó doboz (korábban ki lett dobva)
                Userlist = Box.descendants(CHAT.DOM.users);
                CHAT.Components.Box.changeStatus(box, 'enabled');
                CHAT.Components.User.generateList(Userlist.elem(), eventData.roomData.userIds, true);
                CHAT.Components.Transfer.appendSystemMessage(box, 'forceJoinYou', eventData.triggerId);
            }
            else {
                // Létre kell hozni a dobozt a csatornához
                Box = HD.DOM(
                    HD.DOM(CHAT.DOM.cloneBox).copyPaste(HD.DOM(CHAT.DOM.container).elem())
                );
                box = Box.elem();
                Userlist = Box.descendants(CHAT.DOM.users);

                Box.css({
                    width : `${CHAT.Config.box.defaultSize.width}px`,
                    height : `${CHAT.Config.box.defaultSize.height}px`
                });
                Box.data('room', eventData.room);
                CHAT.Components.User.updateStatuses(CHAT.State.connectedUsers);
                CHAT.Components.Box.fill(box, eventData.room);
                CHAT.Components.User.generateList(Userlist.elem(), eventData.roomData.userIds);
                CHAT.Components.Transfer.appendSystemMessage(box, 'forceJoinYou', eventData.triggerId);
            }
            CHAT.socket.emit('roomJoin', {
                triggerId : eventData.triggerId,
                userId : CHAT.userId,
                room : eventData.room
            });
            CHAT.Components.Notification.trigger(box, {
                type : 'forceJoinYou',
                fromId : eventData.triggerId,
                local : false
            });
        }
        else if (box){
            // Új user csatlakozott a csatornához
            Userlist = Box.descendants(CHAT.DOM.users);
            CHAT.Components.User.generateList(Userlist.elem(), eventData.roomData.userIds, true);
            CHAT.Components.Transfer.appendSystemMessage(box, 'forceJoinOther', eventData.triggerId, eventData.userId);
            CHAT.Components.Notification.trigger(box, {
                type : 'forceJoinOther',
                fromId : eventData.triggerId,
                toId : eventData.userId,
                local : true
            });
        }
    },

    /**
     * Kidobás csatornából
     * @param {Object} eventData
     * @description
     * eventData = {
     *     triggerId : Number,
     *     userId : Number,
     *     room : String,
     *     roomData : Object
     * }
     */
    roomForceLeaved : function(eventData){
        const Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${eventData.room}"]`);
        const box = Box.elem();

        if (box){
            if (eventData.userId === CHAT.userId){
                CHAT.Components.Transfer.appendSystemMessage(box, 'forceLeaveYou', eventData.triggerId);
                CHAT.Components.Box.changeStatus(box, 'disabled');
                CHAT.Components.Notification.trigger(box, {
                    type : 'forceLeaveYou',
                    fromId : eventData.triggerId,
                    local : true
                });
            }
            else {
                CHAT.Components.Transfer.appendSystemMessage(
                    box, 'forceLeaveOther', eventData.triggerId, eventData.userId
                );
                CHAT.Components.Notification.trigger(box, {
                    type : 'forceLeaveOther',
                    fromId : eventData.triggerId,
                    toId : eventData.userId,
                    local : true
                });
            }
            Box.descendants(`[data-id="${eventData.userId}"]`).remove();
        }
    },

    /**
     * Üzenetküldés
     * @param {Object} messageData
     * @description
     * messageData = {
     *     userId : Number,   // üzenetet küldő user
     *     room : String,     // csatorna azonosító
     *     message : String,  // üzenet
     *     time : Number      // timestamp
     * }
     */
    sendMessage : function(messageData){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${messageData.room}"]`).elem();

        if (box){
            CHAT.Components.Transfer.appendUserMessage(box, messageData);
            CHAT.Components.Notification.stopWrite(box, messageData.userId, '');
            CHAT.Components.Notification.trigger(box, {
                type : 'message',
                fromId : messageData.userId,
                local : true
            });
        }
    },

    /**
     * Üzenetírás
     * @param {Object} messageData
     * @description
     * messageData = {
     *     userId : Number,   // üzenetet küldő user
     *     room : String,     // csatorna azonosító
     *     message : String,  // üzenet eddig megírt darabja
     *     time : Number      // timestamp
     * }
     */
    typeMessage : function(messageData){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${messageData.room}"]`).elem();
        const writing = CHAT.Components.Timer.writing;

        if (box){
            writing.event = true;
            writing.message = messageData.message;
            if (!writing.timerID){
                CHAT.Components.Notification.stillWrite(box, messageData.userId);
                writing.timerID = setInterval(function(){
                    if (!writing.event){
                        CHAT.Components.Notification.stopWrite(box, messageData.userId, writing.message);
                    }
                    writing.event = false;
                }, writing.interval);
            }
        }
    },

    /**
     * Fájlfogadás folyamata
     * @param {Object} streamData
     * @description
     * streamData = {
     *     userId : Number,
     *     room : String,
     *     uploadedSize : Number,
     *     fileSize : Number,
     *     firstSend : Boolean
     * }
     */
    receiveFile : function(streamData){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${streamData.room}"]`).elem();

        if (CHAT.userId !== streamData.userId && box){
            if (streamData.firstSend){
                CHAT.Events.Server.barId = CHAT.Components.Transfer.progressbar(
                    box, 'get', streamData.uploadedSize / streamData.fileSize, null, false
                );
            }
            else {
                CHAT.Components.Transfer.progressbar(
                    box, 'get', streamData.uploadedSize / streamData.fileSize, CHAT.Events.Server.barId, false
                );
            }
        }
    },

    /**
     * Fájlfogadás vége (a fájl átjött)
     * @param {Object} fileData
     * @description
     * fileData = {
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
    sendFile : function(fileData){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${fileData.room}"]`).elem();

        if (box){
            CHAT.FileTransfer.action('serverSend', [box, fileData, function(){
                CHAT.Components.Notification.trigger(box, {
                    type : 'file',
                    fromId : fileData.userId,
                    local : true
                });
            }]);
            CHAT.Components.Notification.stopWrite(box, fileData.userId, '');
        }
    },

    /**
     * Fájlátvitel megszakítása a fogadó oldalon
     * @param {Object} fileAbortData
     * @description
     * fileAbortData = {
     *     forced : Boolean,
     *     file : {
     *         userId : Number,
     *         raw : {
     *             name : String,
     *             size : Number,
     *             type : String,
     *             source : String
     *         },
     *         store : String,
     *         type : String,
     *         time : Number,
     *         room : String,
     *         name : String,
     *         deleted : Boolean
     *     }
     * }
     */
    abortFile : function(fileAbortData){
        const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${fileAbortData.file.room}"]`).elem();

        if (box){
            const method = fileAbortData.forced ? 'forceAbort' : 'abort';
            CHAT.Components.Transfer.progressbar(box, method, null, CHAT.Events.Server.barId, false);
        }
    }

};
