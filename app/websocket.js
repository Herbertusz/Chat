/**
 *
 */

'use strict';

let ChatModel;
const ENV = require.main.require('../app/env.js');
const fs = require('mz/fs');
const path = require('path');
const ioExpressSession = require('socket.io-express-session');
const log = require.main.require('../libs/log.js');
const HD = require.main.require('../app/public/js/hd/hd.js')(['utility', 'math']);
const Config = require.main.require('../app/config/config.js');
const FileTransfer = require.main.require('../app/public/js/chat/filetransfer.js');
const CHAT = Object.assign({}, Config, FileTransfer);  // TODO: nincs erre jobb módszer?

/**
 * Állapot tároló objektum
 * Külső elérés: req.app.get('socket').getState()
 * @type {Object}
 */
const ChatState = {

    /**
     * Chat-be belépett userek
     * @type {Object}
     * @description
     * connectedUsers = {
     *     <socket.id> : {
     *         id : Number,      // user azonosító
     *         name : String,    // user login név
     *         status : String,  // user státusz (CHAT.Labels.status.online + offline)
     *         isIdle : Boolean  // user tétlen státuszban van
     *     },
     *     ...
     * }
     */
    connectedUsers : {},

    /**
     * Futó chat-csatornák
     * @type {Array}
     * @description
     * rooms = [
     *     {
     *         name : String,    // 'room-x-y'; x: létrehozó userId, y: létrehozás timestamp
     *         userIds : Array,  // csatornába rakott userId-k
     *         starter : Number  // csatorna létrehozó userId
     *     },
     *     ...
     * ]
     */
    rooms : []

};

/**
 * Websocket vezérlés
 * @param {Object} server - http szerver
 * @param {Object} ioSession - express-session
 * @param {Object} app - express
 * @returns {Object}
 */
module.exports = function(server, ioSession, app){

    ChatModel = require.main.require(`../app/models/${ENV.DBDRIVER}/chat.js`)(app.get('db'));

    /**
     * Csatorna adatainak lekérése név alapján
     * @param {String} name
     * @returns {Object}
     */
    const getRoom = function(name){
        return ChatState.rooms.find(function(room){
            return room.name === name;
        });
    };

    /**
     * Csatornák törlése, melyekben nincs user, vagy csak offline userek vannak
     * @returns {Array<String>} törölt csatornák azonosítói
     */
    const roomGarbageCollect = function(){
        const deleted = [];
        const onlineUserIds = [];
        let key;

        for (key in ChatState.connectedUsers){
            onlineUserIds.push(ChatState.connectedUsers[key].id);
        }
        ChatState.rooms.forEach(function(room, index){
            if (room.userIds.length === 0 || HD.Math.Set.intersection(room.userIds, onlineUserIds).length === 0){
                // fájlok törlése
                ChatModel.deleteRoomFiles(room.name)
                    .then(function(urls){
                        for (let i = 0; i < urls.length; i++){
                            const filePath = path.resolve(`${app.get('upload')}/${urls[i]}`);
                            fs.access(filePath, fs.W_OK)
                                .then(function(){
                                    return fs.unlink(filePath);
                                })
                                .catch(function(error){
                                    log.error(error);
                                });
                        }
                    });

                deleted.push(room.name);
                ChatState.rooms.splice(index, 1);
            }
        });
    };

    /**
     * Csatorna módosítása
     * @param {String} operation - művelet ('add'|'remove')
     * @param {String} room - csatorna azonosító
     * @param {Number} userId - user azonosító
     */
    const roomUpdate = function(operation, room, userId){
        let userIdIndex = -1;

        if (!room){
            // összes csatorna
            ChatState.rooms.forEach(function(roomData){
                roomUpdate(operation, roomData.name, userId);
            });
            return;
        }
        const roomIndex = ChatState.rooms.findIndex(function(roomData){
            return roomData.name === room;
        });
        if (roomIndex > -1){
            if (operation === 'add'){
                userIdIndex = ChatState.rooms[roomIndex].userIds.indexOf(userId);
                if (userIdIndex === -1){
                    ChatState.rooms[roomIndex].userIds.push(userId);
                }
            }
            else if (operation === 'remove'){
                userIdIndex = ChatState.rooms[roomIndex].userIds.indexOf(userId);
                if (userIdIndex > -1){
                    ChatState.rooms[roomIndex].userIds.splice(userIdIndex, 1);
                }
                roomGarbageCollect();
            }
        }
    };

    /**
     * User-ek állapotváltozásának logolása adatbázisba
     * @param {Object} prevUserData
     * @param {Object} nextUserData
     * @description
     * *UserData = {
     *     id : Number,      // user azonosító
     *     name : String,    // user login név
     *     status : String,  // user státusz (CHAT.Labels.status.online + offline)
     *     isIdle : Boolean  // user tétlen státuszban van
     * }
     */
    const statusLog = function(prevUserData, nextUserData){
        const statuses = {
            active : CHAT.Config.status.active,
            inactive : CHAT.Config.status.inactive
        };

        if (!HD.Misc.defined(prevUserData) || !HD.Misc.defined(nextUserData)){
            return;
        }
        if (!prevUserData){
            prevUserData = {
                id : nextUserData.id,
                name : nextUserData.name,
                status : CHAT.Config.status.offline[0],
                isIdle : false
            };
        }
        if (!nextUserData){
            nextUserData = {
                id : prevUserData.id,
                name : prevUserData.name,
                status : CHAT.Config.status.offline[0],
                isIdle : false
            };
        }

        const userId = prevUserData.id;
        const prevStatus = prevUserData.isIdle ? 'idle' : prevUserData.status;
        const nextStatus = nextUserData.isIdle ? 'idle' : nextUserData.status;

        if (CHAT.Config.status.idle.timeCounter){
            let type = null;
            if (statuses.active.indexOf(prevStatus) > -1 && statuses.inactive.indexOf(nextStatus) > -1){
                type = 0;  // inaktiválás
            }
            else if (statuses.inactive.indexOf(prevStatus) > -1 && statuses.active.indexOf(nextStatus) > -1){
                type = 1;  // aktiválás
            }
            if (type !== null){
                ChatModel.setStatus({type, userId, prevStatus, nextStatus})
                    .catch(function(error){
                        log.error(error);
                    });
            }
        }
    };

    const io = require('socket.io')(server);
    io.of('/chat').use(ioExpressSession(ioSession));

    /**
     * Belépés a chat-be
     * @param {Object} socket
     */
    io.of('/chat').on('connection', function(socket){

        let userData = null;
        const session = socket.handshake.session;

        // user azonosítása
        if (session.login && session.login.loginned){
            // belépett user
            userData = {
                id : session.login.userId,
                status : CHAT.Config.status.online[0],
                isIdle : false
            };
        }

        /**
         * Csatlakozás emitter
         */
        if (userData){
            ChatState.connectedUsers[socket.id] = userData;
            socket.broadcast.emit('userConnected', userData);
            io.of('/chat').emit('statusChanged', ChatState.connectedUsers);
            statusLog(null, userData);
            ChatState.rooms.forEach(function(roomData){
                if (roomData.userIds.indexOf(userData.id) > -1){
                    socket.join(roomData.name);
                    io.of('/chat').to(roomData.name).emit(
                        'roomJoined', Object.assign(roomData, {joinedUserId : userData.id})
                    );
                }
            });
        }

        /**
         * Csatlakozás bontása emitter
         */
        socket.on('disconnect', function(){
            const discUserData = ChatState.connectedUsers[socket.id];

            if (discUserData){
                Reflect.deleteProperty(ChatState.connectedUsers, socket.id);
                //roomUpdate('remove', null, discUserData.id);
                statusLog(discUserData, null);
                io.of('/chat').emit('statusChanged', ChatState.connectedUsers);
                io.of('/chat').emit('disconnect', discUserData);
            }
        });

        /**
         * User állapotváltozása emitter
         * @param {Object} updatedConnectedUsers - a pillanatnyilag csatlakozott usereket tároló objektum
         * @param {Number} triggerUserId - az eseményt kiváltó userId
         * @description
         * connectedUsers = {
         *     <socket.id> : {
         *         id : Number,      // user azonosító
         *         name : String,    // user login név
         *         status : String,  // user státusz (CHAT.Labels.status.online + offline)
         *         isIdle : Boolean  // user tétlen státuszban van
         *     },
         *     ...
         * }
         */
        socket.on('statusChanged', function(updatedConnectedUsers, triggerUserId){
            const prevUserData = HD.Object.search(ChatState.connectedUsers, user => user.id === triggerUserId);
            const nextUserData = HD.Object.search(updatedConnectedUsers, user => user.id === triggerUserId);
            statusLog(prevUserData, nextUserData);
            ChatState.connectedUsers = updatedConnectedUsers;
            socket.broadcast.emit('statusChanged', updatedConnectedUsers);
        });

        /**
         * Csatorna létrehozása emitter
         * @param {Object} data
         * data = {
         *     triggerId : Number,      // csatornát létrehozó userId
         *     userId : Array<Number>,  // csatornában lévő userId-k
         *     room : String            // csatorna azonosító
         * }
         */
        socket.on('roomCreated', function(data){
            const roomData = {
                name : data.room,
                userIds : data.userId,
                starter : data.triggerId
            };
            ChatState.rooms.push(roomData);
            socket.join(roomData.name);
            socket.broadcast.emit('roomCreated', roomData);
            ChatModel.setEvent('roomCreated', data);
        });

        /**
         * Belépés csatornába emitter
         * @param {Object} data
         * data = {
         *     triggerId : Number,  // belépést kiváltó userId
         *     userId : Number,     // belépett userId (ugyanaz mint a fenti)
         *     room : String        // csatorna azonosító
         * }
         */
        socket.on('roomJoin', function(data){
            socket.join(data.room);
            ChatModel.setEvent('roomJoin', data);
        });

        /**
         * Kilépés csatornából emitter
         * @param {Object} data
         * data = {
         *     triggerId : Number,  // kilépést kiváltó userId
         *     userId : Number,     // kilépett userId (ugyanaz mint a fenti)
         *     room : String,       // csatorna azonosító
         *     silent : Boolean     // nem megy ki róla értesítés
         * }
         */
        socket.on('roomLeave', function(data){
            const roomData = getRoom(data.room);
            if (!data.silent){
                socket.broadcast.emit('roomLeaved', Object.assign(data, {roomData : roomData}));
            }
            roomUpdate('remove', data.room, data.userId);
            socket.leave(data.room, () => {});
            ChatModel.setEvent('roomLeave', data);
        });

        /**
         * Hozzáadás csatornához emitter
         * @param {Object} data
         * data = {
         *     triggerId : Number,  // hozzáadást kiváltó userId
         *     userId : Number,     // beléptetett userId (nem egyezik a fentivel)
         *     room : String        // csatorna azonosító
         * }
         */
        socket.on('roomForceJoin', function(data){
            const roomData = getRoom(data.room);
            roomUpdate('add', data.room, data.userId);
            socket.broadcast.emit('roomForceJoined', Object.assign(data, {roomData : roomData}));
            ChatModel.setEvent('roomForceJoin', data);
        });

        /**
         * Kidobás csatornából emitter
         * @param {Object} data
         * data = {
         *     triggerId : Number,  // kidobást kiváltó userId
         *     userId : Number,     // kidobott userId (nem egyezik a fentivel)
         *     room : String        // csatorna azonosító
         * }
         */
        socket.on('roomForceLeave', function(data){
            const roomData = getRoom(data.room);
            roomUpdate('remove', data.room, data.userId);
            socket.broadcast.emit('roomForceLeaved', Object.assign(data, {roomData : roomData}));
            ChatModel.setEvent('roomForceLeave', data);
        });

        /**
         * Üzenetküldés emitter
         * @param {Object} data
         * data = {
         *     userId : Number,   // üzenetet küldő user
         *     room : String,     // csatorna azonosító
         *     message : String,  // üzenet
         *     time : Number      // timestamp
         * }
         */
        socket.on('sendMessage', function(data){
            data.userId = userData.id;  // TODO: ez kell?
            socket.broadcast.to(data.room).emit('sendMessage', data);
            ChatModel.setMessage(data);
        });

        /**
         * Fájlküldés emitter
         * @param {Object} data
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
        socket.on('sendFile', function(data){
            const errors = CHAT.FileTransfer.fileCheck(data, CHAT.Config.fileTransfer);
            if (errors.length > 0){
                socket.broadcast.to(data.room).emit('abortFile', {
                    forced : true,
                    file : data
                });
            }
            else {
                ChatModel.setFile({
                    userId : userData.id,
                    file : data
                }).then(function(){
                    socket.broadcast.to(data.room).emit('sendFile', data);
                    socket.emit('dbFile', data);
                }).catch(function(error){
                    log.error(error);
                });
            }
        });

        /**
         * Fájlátvitel megszakítás emitter
         * @param {Object} data
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
        socket.on('abortFile', function(data){
            const filePath = path.resolve(`${app.get('upload')}/${data.file.name}`);
            socket.broadcast.to(data.file.room).emit('abortFile', data);
            ChatModel.setEvent('abortFile', data.file.room, data.file);
            ChatModel.deleteFile(data.file.name)
                .then(function(){
                    return fs.access(filePath, fs.W_OK);
                })
                .then(function(){
                    return fs.unlink(filePath);
                })
                .catch(function(error){
                    log.error(error);
                });
        });

        /**
         * Üzenetírás emitter
         * @param {Object} data
         * data = {
         *     userId : Number,   // üzenetet író user
         *     room : String,     // csatorna azonosító
         *     message : String,  // eddig beírt üzenet
         *     time : Number      // timestamp
         * };
         */
        socket.on('typeMessage', function(data){
            socket.broadcast.to(data.room).emit('typeMessage', data);
        });

    });

    io.of('/videochat').on('connection', function(socket){

        // convenience function to log server messages on the client
        const clientLog = function(...args){
            const array = ['Message from server:'];
            array.push(...args);
            socket.emit('log', array);
        };

        socket.on('message', function(message){
            clientLog('Client said: ', message);
            socket.broadcast.emit('message', message);
        });

        socket.on('create or join', function(room){
            clientLog(`Received request to create or join room ${room}`);

            const numClients = Object.keys(io.sockets.sockets).length;
            clientLog(`Room ${room} now has ${numClients} client(s)`);

            if (numClients === 1){
                socket.join(room);
                clientLog(`Client ID ${socket.id} created room ${room}`);
                socket.emit('created', room, socket.id);
            }
            else {
                clientLog(`Client ID ${socket.id} joined room ${room}`);
                socket.broadcast.to(room).emit('join', room);
                socket.join(room);
                socket.broadcast.to(room).emit('joined', room, socket.id);
                socket.broadcast.to(room).emit('ready');
            }

        });

    });

    return {
        io : io,
        getState : () => ChatState
    };

};
