/* global HD */

"use strict";

var CHAT = window.CHAT || {};

/**
 * Eseménykezelők
 * @type {Object}
 */
CHAT.Events = {

    /**
     * Kliens által küldött események kezelése
     * @type {Object}
     */
    Client : {

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
                currentUserIds.push(Number(HD.DOM(user).data("id")));
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
            const userId = User.data("id");

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
            const Message = Box.find(CHAT.DOM.message);
            const data = {
                userId : CHAT.USER.id,
                message : Message.elem().value,
                time : Math.round(Date.now() / 1000),
                roomName : Box.data("room")
            };

            if (data.message.trim().length > 0){
                CHAT.socket.emit('sendMessage', data);
                CHAT.Method.appendUserMessage(box, data, true);
                Box.find(CHAT.DOM.message).elem().value = '';
            }
        },

        /**
         * Fájlküldés
         * @param {HTMLElement} box
         * @param {Object} files
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
                    })).then((function(){
                        CHAT.Method.progress(box, "hide");
                        return CHAT.FileTransfer.action('clientSend', [box, fileData, reader, rawFile]);
                    }));
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
            const barId = HD.DOM(progressbar).data("id");
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
            const Message = Box.find(CHAT.DOM.message);
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
                Box.find(CHAT.DOM.sendButton).class("add", "hidden-weak");
            }
            else {
                Box.find(CHAT.DOM.sendButton).class("remove", "hidden-weak");
            }
        }

    },

    /**
     * Szerver által küldött események kezelése
     * @type Object
     */
    Server : {

        /**
         * Belépés a chat-be
         * @param {Object} data
         */
        userConnected : function(data){
            // CHAT.Method.appendSystemMessage(box, 'connect', data.id);
        },

        /**
         * Kilépés a chat-ből
         * @param {Object} data
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
         */
        statusChanged : function(connectedUsers){
            HD.DOM(CHAT.DOM.online).data("connectedUsers", connectedUsers);
            CHAT.Method.updateStatuses(connectedUsers);
        },

        /**
         * Csatorna létrehozása
         * @param {Object} roomData
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
                CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).data("connectedUsers"));
                CHAT.socket.emit('roomJoin', {roomName : roomData.name});
            }
        },

        /**
         * Csatornához csatlakozás
         * @param {Object} roomData
         */
        roomJoined : function(roomData){
            let Box, Userlist;

            if (roomData.joinedUserId === CHAT.USER.id){
                // Létre kell hozni a dobozt a csatornához
                Box = HD.DOM(
                    CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
                );
                Userlist = Box.find(CHAT.DOM.users);
                Box.data("room", roomData.name);
                CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds);
                CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).data("connectedUsers"));
                CHAT.Method.fillBox(Box.elem(), roomData.name);
            }
            else {
                // Csatlakozott a csatornához
                Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${roomData.name}"]`);
                Userlist = Box.find(CHAT.DOM.users);
                CHAT.Method.appendSystemMessage(Box.elem(), 'join', roomData.joinedUserId);
                CHAT.Method.generateUserList(Userlist.elem(), roomData.userIds, true);
            }
        },

        /**
         * Csatorna elhagyása
         * @param {Object} extData
         * @description szerkezet: {
         *     userId : Number,
         *     roomData : Object
         * }
         */
        roomLeaved : function(extData){
            let Box;

            if (extData.roomData){
                Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
                CHAT.Method.appendSystemMessage(Box.elem(), 'leave', extData.userId);
                Box.find(`[data-id="${extData.userId}"]`).remove();
            }
        },

        /**
         * Hozzáadás csatornához
         * @param {Object} extData
         * @description szerkezet: {
         *     triggerId : Number,
         *     userId : Number,
         *     roomData : Object
         * }
         */
        roomForceJoined : function(extData){
            let Box, Userlist;

            Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);

            if (extData.userId === CHAT.USER.id){
                // Csatlakoztattak a csatornához
                if (Box.elements.length > 0){
                    // Van a csatornához tartozó doboz (korábban ki lett dobva)
                    Userlist = Box.find(CHAT.DOM.users);
                    CHAT.Method.changeBoxStatus(Box.elem(), "enabled");
                    CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds, true);
                    CHAT.Method.appendSystemMessage(Box.elem(), 'forceJoinYou', extData.triggerId);
                }
                else {
                    // Létre kell hozni a dobozt a csatornához
                    Box = HD.DOM(
                        CHAT.Util.cloneElement(HD.DOM(CHAT.DOM.cloneBox).elem(), HD.DOM(CHAT.DOM.container).elem())
                    );
                    Userlist = Box.find(CHAT.DOM.users);
                    Box.data("room", extData.roomData.name);
                    CHAT.Method.updateStatuses(HD.DOM(CHAT.DOM.online).data("connectedUsers"));
                    CHAT.Method.fillBox(Box.elem(), extData.roomData.name);
                    CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds);
                    CHAT.Method.appendSystemMessage(Box.elem(), 'forceJoinYou', extData.triggerId);
                }
                CHAT.socket.emit('roomJoin', {
                    userId : CHAT.USER.id,
                    roomName : extData.roomData.name
                });
                CHAT.Method.notification(Box.elem(), extData.triggerId, "forceJoin");
            }
            else {
                // Új user csatlakozott a csatornához
                Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
                Userlist = Box.find(CHAT.DOM.users);
                CHAT.Method.generateUserList(Userlist.elem(), extData.roomData.userIds, true);
                CHAT.Method.appendSystemMessage(Box.elem(), 'forceJoinOther', extData.triggerId, extData.userId);
            }
        },

        /**
         * Kidobás csatornából
         * @param {Object} extData
         * @description szerkezet: {
         *     triggerId : Number,
         *     userId : Number,
         *     roomData : Object
         * }
         */
        roomForceLeaved : function(extData){
            const Box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);

            if (extData.userId === CHAT.USER.id){
                CHAT.Method.appendSystemMessage(Box.elem(), 'forceLeaveYou', extData.triggerId);
                CHAT.socket.emit('roomLeave', {
                    silent : true,
                    userId : CHAT.USER.id,
                    roomName : extData.roomData.name
                });
                CHAT.Method.changeBoxStatus(Box.elem(), "disabled");
                CHAT.Method.notification(Box.elem(), extData.triggerId, "forceLeave");
            }
            else {
                CHAT.Method.appendSystemMessage(Box.elem(), 'forceLeaveOther', extData.triggerId, extData.userId);
            }
            Box.find(`[data-id="${extData.userId}"]`).remove();
        },

        /**
         * Üzenetküldés
         * @param {Object} data
         * @description data szerkezete: {
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
                CHAT.Method.notification(box, data.userId, "message");
            }
        },

        /**
         * Fájlfogadás folyamata
         * @param {Object} data
         * @description data szerkezete: {
         *     userId : Number,
         *     roomName : String,
         *     uploadedSize : Number,
         *     fileSize : Number,
         *     firstSend : Boolean
         * }
         */
        fileReceive : function(data){
            const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

            if (CHAT.USER.id !== data.userId){
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
        sendFile : function(data){
            const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

            if (box){
                CHAT.FileTransfer.action('serverSend', [box, data]);
                CHAT.Method.stopWrite(box, data.userId, '');
                CHAT.Method.notification(box, data.userId, "file");
            }
        },

        /**
         * Fájlátvitel megszakítása a fogadó oldalon
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
        abortFile : function(data){
            const box = HD.DOM(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`).elem();

            if (box){
                CHAT.Method.progressbar(box, "abort", null, CHAT.Events.Server.barId, false);
            }
        },

        /**
         * Üzenetírás
         * @param {Object} data
         * @description szerkezet: {
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

    }

};
