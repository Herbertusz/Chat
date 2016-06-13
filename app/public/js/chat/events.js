/* global HD */

"use strict";

var CHAT = window.CHAT || {};

/**
 * Eseménykezelők
 * @type Object
 */
CHAT.Events = {

    /**
     * Kliens által küldött események kezelése
     * @type Object
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
            const $box = CHAT.Util.cloneElement($(CHAT.DOM.cloneBox), $(CHAT.DOM.container));
            const $users = $box.find(CHAT.DOM.users);

            $(CHAT.DOM.online).find(CHAT.DOM.selectedUsers).each(function(){
                const userId = Number($(this).val());
                roomData.userIds.push(userId);
            });
            CHAT.Method.generateUserList($users, roomData.userIds);
            roomData.name = `room-${roomData.starter}-${Date.now()}`;
            $box.attr("data-room", roomData.name);
            CHAT.socket.emit('roomCreated', roomData);
        },

        /**
         * Kilépés csatornából
         * @param {jQuery} $box
         */
        leaveRoom : function($box){
            const roomName = $box.data("room");

            $box.remove();
            CHAT.socket.emit('roomLeave', {
                userId : CHAT.USER.id,
                roomName : roomName
            });
        },

        /**
         * User hozzáadása csatornához
         * @param {jQuery} $add
         * @param {Number} userId
         */
        forceJoinRoom : function($add, userId){
            const $box = $add.parents(CHAT.DOM.box);
            const $users = $box.find(CHAT.DOM.users);
            const currentUserIds = [];
            const roomName = $box.data("room");

            $users.find(CHAT.DOM.userItems).filter(':not(.cloneable)').each(function(){
                currentUserIds.push(Number($(this).attr("data-id")));
            });
            if (currentUserIds.indexOf(userId) === -1){
                CHAT.Method.generateUserList($users, [userId]);
                CHAT.socket.emit('roomForceJoin', {
                    triggerId : CHAT.USER.id,
                    userId : userId,
                    roomName : roomName
                });
            }
        },

        /**
         * User kidobása csatornából
         * @param {jQuery} $close
         */
        forceLeaveRoom : function($close){
            const $box = $close.parents(CHAT.DOM.box);
            const $user = $close.parents(CHAT.DOM.userItems);
            const roomName = $box.data("room");
            const userId = $user.data("id");

            if (userId === CHAT.USER.id){
                // kilépés
                $box.remove();
                CHAT.socket.emit('roomLeave', {
                    userId : CHAT.USER.id,
                    roomName : roomName
                });
            }
            else {
                // másik felhasználó kidobása
                $user.remove();
                CHAT.socket.emit('roomForceLeave', {
                    triggerId : CHAT.USER.id,
                    userId : userId,
                    roomName : roomName
                });
            }
        },

        /**
         * Üzenetküldés
         * @param {jQuery} $box
         */
        sendMessage : function($box){
            const $message = $box.find(CHAT.DOM.message);
            const data = {
                userId : CHAT.USER.id,
                message : $message.val(),
                time : Math.round(Date.now() / 1000),
                roomName : $box.data("room")
            };

            if (data.message.trim().length > 0){
                CHAT.socket.emit('sendMessage', data);
                CHAT.Method.appendUserMessage($box, data, true);
                $box.find(CHAT.DOM.message).val('');
            }
        },

        /**
         * Fájlküldés
         * @param {jQuery} $box
         * @param {Object} files
         */
        sendFile : function($box, files){
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
                    roomName : $box.data("room")
                };
                const errors = fileCheck(fileData, rawFile);

                if (errors.length === 0){
                    const reader = new FileReader();
                    (new Promise(function(resolve){
                        CHAT.Method.progress($box, "show");
                        reader.onload = resolve;
                    })).then((function(){
                        CHAT.Method.progress($box, "hide");
                        return CHAT.FileTransfer.action('clientSend', [$box, fileData, reader, rawFile]);
                    }));
                    reader.readAsDataURL(rawFile);
                }
                else {
                    CHAT.Method.showError($box, errors);
                }
            };

            files.forEach(function(rawFile){
                filePrepare(rawFile);
            });
        },

        /**
         * Fájlküldés megszakítása
         * @param $progressbar
         */
        abortFile : function($progressbar){
            const barId = $progressbar.data("id");
            if (typeof CHAT.FileTransfer.XHR[barId] !== "undefined"){
                CHAT.FileTransfer.XHR[barId].abort();
            }
        },

        /**
         * Gépelés
         * @param {jQuery} $box
         */
        typeMessage : function($box){
            const $message = $box.find(CHAT.DOM.message);
            const data = {
                userId : CHAT.USER.id,
                message : $message.val(),
                time : Math.round(Date.now() / 1000),
                roomName : $box.data("room")
            };

            CHAT.socket.emit('typeMessage', data);
        },

        /**
         * Üzenetküldés módjának változtatása
         * @param {jQuery} $change
         */
        sendMethod : function($change){
            const $box = $change.parents('.chat');

            if ($change.prop("checked")){
                $box.find(CHAT.DOM.sendButton).hide();
            }
            else {
                $box.find(CHAT.DOM.sendButton).show();
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
         * @param {type} data
         */
        userConnected : function(data){
            // CHAT.Method.appendSystemMessage($box, 'connect', data.id);
        },

        /**
         * Kilépés a chat-ből
         * @param {type} data
         */
        disconnect : function(data){
            $(CHAT.DOM.box).filter(':not(.cloneable)').each(function(){
                const $box = $(this);
                if ($box.find(CHAT.DOM.userItems).filter(`[data-id="${data.id}"]`).length > 0){
                    CHAT.Method.appendSystemMessage($box, 'leave', data.id);
                    $box.find(`[data-id="${data.id}"]`).remove();
                }
            });
        },

        /**
         * User-ek állapotváltozása
         * @param {type} connectedUsers
         */
        statusChanged : function(connectedUsers){
            $(CHAT.DOM.online).data("connectedUsers", connectedUsers);
            CHAT.Method.updateStatuses(connectedUsers);
        },

        /**
         * Csatorna létrehozása
         * @param {type} roomData
         */
        roomCreated : function(roomData){
            let $box, $users;

            if (roomData.userIds.indexOf(CHAT.USER.id) > -1){
                $box = CHAT.Util.cloneElement($(CHAT.DOM.cloneBox), $(CHAT.DOM.container));
                $users = $box.find(CHAT.DOM.users);
                $box.attr("data-room", roomData.name);
                CHAT.Method.generateUserList($users, roomData.userIds);
                CHAT.Method.updateStatuses($(CHAT.DOM.online).data("connectedUsers"));
                CHAT.socket.emit('roomJoin', {roomName : roomData.name});
            }
        },

        /**
         * Csatornához csatlakozás
         * @param {type} roomData
         */
        roomJoined : function(roomData){
            let $box, $users;

            if (roomData.joinedUserId === CHAT.USER.id){
                // Létre kell hozni a dobozt a csatornához
                $box = CHAT.Util.cloneElement($(CHAT.DOM.cloneBox), $(CHAT.DOM.container));
                $users = $box.find(CHAT.DOM.users);
                $box.attr("data-room", roomData.name);
                CHAT.Method.generateUserList($users, roomData.userIds);
                CHAT.Method.updateStatuses($(CHAT.DOM.online).data("connectedUsers"));
                CHAT.Method.fillBox($box, roomData.name);
            }
            else {
                // Csatlakozott a csatornához
                $box = $(CHAT.DOM.box).filter(`[data-room="${roomData.name}"]`);
                $users = $box.find(CHAT.DOM.users);
                CHAT.Method.appendSystemMessage($box, 'join', roomData.joinedUserId);
                CHAT.Method.generateUserList($users, roomData.userIds, true);
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
            let $box;

            if (extData.roomData){
                $box = $(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
                CHAT.Method.appendSystemMessage($box, 'leave', extData.userId);
                $box.find(`[data-id="${extData.userId}"]`).remove();
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
            let $box, $users;

            $box = $(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);

            if (extData.userId === CHAT.USER.id){
                // Csatlakoztattak a csatornához
                if ($box.length > 0){
                    // Van a csatornához tartozó doboz (korábban ki lett dobva)
                    $users = $box.find(CHAT.DOM.users);
                    CHAT.Method.changeBoxStatus($box, 'enabled');
                    CHAT.Method.generateUserList($users, extData.roomData.userIds, true);
                    CHAT.Method.appendSystemMessage($box, 'forceJoinYou', extData.triggerId);
                }
                else {
                    // Létre kell hozni a dobozt a csatornához
                    $box = CHAT.Util.cloneElement($(CHAT.DOM.cloneBox), $(CHAT.DOM.container));
                    $users = $box.find(CHAT.DOM.users);
                    $box.attr("data-room", extData.roomData.name);
                    CHAT.Method.updateStatuses($(CHAT.DOM.online).data("connectedUsers"));
                    CHAT.Method.fillBox($box, extData.roomData.name);
                    CHAT.Method.generateUserList($users, extData.roomData.userIds);
                    CHAT.Method.appendSystemMessage($box, 'forceJoinYou', extData.triggerId);
                }
                CHAT.socket.emit('roomJoin', {
                    userId : CHAT.USER.id,
                    roomName : extData.roomData.name
                });
                CHAT.Method.notification($box, extData.triggerId, "forceJoin");
            }
            else {
                // Új user csatlakozott a csatornához
                $box = $(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);
                $users = $box.find(CHAT.DOM.users);
                CHAT.Method.generateUserList($users, extData.roomData.userIds, true);
                CHAT.Method.appendSystemMessage($box, 'forceJoinOther', extData.triggerId, extData.userId);
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${extData.roomData.name}"]`);

            if (extData.userId === CHAT.USER.id){
                CHAT.Method.appendSystemMessage($box, 'forceLeaveYou', extData.triggerId);
                CHAT.socket.emit('roomLeave', {
                    silent : true,
                    userId : CHAT.USER.id,
                    roomName : extData.roomData.name
                });
                CHAT.Method.changeBoxStatus($box, 'disabled');
                CHAT.Method.notification($box, extData.triggerId, "forceLeave");
            }
            else {
                CHAT.Method.appendSystemMessage($box, 'forceLeaveOther', extData.triggerId, extData.userId);
            }
            $box.find(`[data-id="${extData.userId}"]`).remove();
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`);

            if ($box.length > 0){
                CHAT.Method.appendUserMessage($box, data);
                CHAT.Method.stopWrite($box, data.userId, '');
                CHAT.Method.notification($box, data.userId, "message");
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`);

            if (CHAT.USER.id !== data.userId){
                if (data.firstSend){
                    CHAT.Events.Server.barId = CHAT.Method.progressbar(
                        $box, "get", data.uploadedSize / data.fileSize, null, false
                    );
                }
                else {
                    CHAT.Method.progressbar(
                        $box, "get", data.uploadedSize / data.fileSize, CHAT.Events.Server.barId, false
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`);

            if ($box.length > 0){
                CHAT.FileTransfer.action('serverSend', [$box, data]);
                CHAT.Method.stopWrite($box, data.userId, '');
                CHAT.Method.notification($box, data.userId, "file");
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`);

            if ($box.length > 0){
                CHAT.Method.progressbar($box, "abort", null, CHAT.Events.Server.barId, false);
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
            const $box = $(CHAT.DOM.box).filter(`[data-room="${data.roomName}"]`);
            const writing = CHAT.timer.writing;

            if ($box.length > 0){
                writing.event = true;
                writing.message = data.message;
                if (!writing.timerID){
                    CHAT.Method.stillWrite($box, data.userId);
                    writing.timerID = window.setInterval(function(){
                        if (!writing.event){
                            CHAT.Method.stopWrite($box, data.userId, writing.message);
                        }
                        writing.event = false;
                    }, writing.interval);
                }
            }
        }

    }

};
