/* global appRoot */

'use strict';

var promisify = require('es6-promisify');
var fs = require('fs');
var ioExpressSession = require('socket.io-express-session');
var log = require.main.require(`../libs/log.js`);
var HD = require.main.require('../libs/hd/hd.math.js');
var ChatModel;

const fsAccess = promisify(fs.access);
const fsUnlink = promisify(fs.unlink);

/**
 * Websocket vezérlés
 * @param {Object} server - http szerver
 * @param {Object} ioSession - express-session
 * @param {Object} app - express
 * @returns {Object}
 */
module.exports = function(server, ioSession, app){

    ChatModel = require.main.require('../app/models/mongodb/chat.js')(app.get('db'));

    /**
     * Chat-be belépett userek
     * @type {Object}
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
    let connectedUsers = {};

    /**
     * Futó chat-csatornák
     * @type {Array}
     * @description
     * rooms = [
     *     {
     *         name : String,    // "room-x-y"; x: létrehozó userId, y: létrehozás timestamp
     *         userIds : Array,  // csatornába rakott userId-k
     *         starter : Number  // csatorna létrehozó userId
     *     },
     *     ...
     * ]
     */
    const rooms = [];

    /**
     * Csatorna adatainak lekérése név alapján
     * @param {String} name
     * @returns {Object}
     */
    const getRoom = function(name){
        return rooms.find(function(room){
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

        for (key in connectedUsers){
            onlineUserIds.push(connectedUsers[key].id);
        }
        rooms.forEach(function(room, index){
            if (room.userIds.length === 0 || HD.Math.Set.intersection(room.userIds, onlineUserIds).length === 0){
                // fájlok törlése
                ChatModel.deleteRoomFiles(room.name)
                    .then(function(urls){
                        for (let i = 0; i < urls.length; i++){
                            const path = `${app.get('public path')}/${urls[i]}`;
                            fsAccess(path, fs.W_OK)
                                .then(function(){
                                    fsUnlink(path);
                                })
                                .catch(function(error){
                                    log.error(error);
                                });
                        }
                    });

                deleted.push(room.name);
                rooms.splice(index, 1);
            }
        });
    };

    /**
     * Csatorna módosítása
     * @param {String} operation - művelet ("add"|"remove")
     * @param {String} roomName - csatorna azonosító
     * @param {Number} userId - user azonosító
     */
    const roomUpdate = function(operation, roomName, userId){
        let userIdIndex = -1;

        if (!roomName){
            // összes csatorna
            rooms.forEach(function(room){
                roomUpdate(operation, room.name, userId);
            });
            return;
        }
        const roomIndex = rooms.findIndex(function(room){
            return room.name === roomName;
        });
        if (roomIndex > -1){
            if (operation === 'add'){
                userIdIndex = rooms[roomIndex].userIds.indexOf(userId);
                if (userIdIndex === -1){
                    rooms[roomIndex].userIds.push(userId);
                }
            }
            else if (operation === 'remove'){
                userIdIndex = rooms[roomIndex].userIds.indexOf(userId);
                if (userIdIndex > -1){
                    rooms[roomIndex].userIds.splice(userIdIndex, 1);
                }
                roomGarbageCollect();
            }
        }
    };

    const io = require('socket.io')(server);
    io.of('/chat').use(ioExpressSession(ioSession));

    // Belépés a chat-be
    io.of('/chat').on('connection', function(socket){

        let userData = null;
        const session = socket.handshake.session;

        if (session.login && session.login.loginned){
            // belépett user
            userData = {
                id : session.login.userId,
                name : session.login.userName,
                status : "on",
                isIdle : false
            };
        }
        if (userData){
            // csatlakozás emitter
            connectedUsers[socket.id] = userData;
            socket.broadcast.emit('userConnected', userData);
            io.of('/chat').emit('statusChanged', connectedUsers);
            rooms.forEach(function(roomData){
                if (roomData.userIds.indexOf(userData.id) > -1){
                    socket.join(roomData.name);
                    io.of('/chat').to(roomData.name).emit(
                        'roomJoined', Object.assign(roomData, {joinedUserId : userData.id})
                    );
                }
            });
        }

        // Csatlakozás bontása
        socket.on('disconnect', function(){
            const discUserData = connectedUsers[socket.id];

            if (discUserData){
                Reflect.deleteProperty(connectedUsers, socket.id);
                roomUpdate('remove', null, discUserData.id);
                io.of('/chat').emit('statusChanged', connectedUsers);
                io.of('/chat').emit('disconnect', discUserData);
            }
        });

        // User állapotváltozása
        socket.on('statusChanged', function(updatedConnectedUsers){
            connectedUsers = updatedConnectedUsers;
            socket.broadcast.emit('statusChanged', updatedConnectedUsers);
        });

        // Csatorna létrehozása
        socket.on('roomCreated', function(roomData){
            rooms.push(roomData);
            socket.join(roomData.name);
            socket.broadcast.emit('roomCreated', roomData);
            ChatModel.setEvent('roomCreated', roomData.name, roomData);
        });

        // Belépés csatornába
        socket.on('roomJoin', function(data){
            socket.join(data.roomName);
            ChatModel.setEvent('roomJoin', data.roomName, data);
        });

        // Kilépés csatornából
        socket.on('roomLeave', function(data){
            const roomData = getRoom(data.roomName);
            const emitData = {
                userId : data.userId,
                roomData : roomData
            };
            if (!data.silent){
                socket.broadcast.emit('roomLeaved', emitData);
            }
            roomUpdate('remove', data.roomName, data.userId);
            socket.leave(data.roomName, () => {});
            ChatModel.setEvent('roomLeave', data.roomName, emitData);
        });

        // Hozzáadás csatornához emitter
        socket.on('roomForceJoin', function(data){
            const emitData = {
                triggerId : data.triggerId,
                userId : data.userId,
                roomData : getRoom(data.roomName)
            };
            roomUpdate('add', data.roomName, data.userId);
            socket.broadcast.emit('roomForceJoined', emitData);
            ChatModel.setEvent('roomForceJoin', data.roomName, emitData);
        });

        // Kidobás csatornából emitter
        socket.on('roomForceLeave', function(data){
            const emitData = {
                triggerId : data.triggerId,
                userId : data.userId,
                roomData : getRoom(data.roomName)
            };
            roomUpdate('remove', data.roomName, data.userId);
            socket.broadcast.emit('roomForceLeaved', emitData);
            ChatModel.setEvent('roomForceLeave', data.roomName, emitData);
        });

        // Üzenetküldés emitter
        socket.on('sendMessage', function(data){
            socket.broadcast.to(data.roomName).emit('sendMessage', data);
            ChatModel.setMessage({
                userId : userData.id,
                room : data.roomName,
                message : data.message,
                time : data.time
            });
        });

        // Fájlküldés emitter
        socket.on('sendFile', function(data){
            socket.broadcast.to(data.roomName).emit('sendFile', data);
            ChatModel.setFile({
                userId : userData.id,
                room : data.roomName,
                store : data.store,
                fileData : data.fileData,
                mainType : data.type,
                file : data.file,
                time : data.time
            });
        });

        // Fájlátvitel megszakítás emitter
        socket.on('abortFile', function(data){
            const filePath = `${app.get('public path')}/upload/${data.fileName}`;
            socket.broadcast.to(data.roomName).emit('abortFile', data);
            ChatModel.setEvent('abortFile', data.roomName, data);
            ChatModel.deleteFile(filePath)
                .then(function(){
                    fsAccess(filePath, fs.W_OK);
                })
                .then(function(){
                    fsUnlink(filePath);
                })
                .catch(function(error){
                    log.error(error);
                });
        });

        // Üzenetírás emitter
        socket.on('typeMessage', function(data){
            socket.broadcast.to(data.roomName).emit('typeMessage', data);
        });

    });

    io.of('/videochat').on('connection', function(socket){

        // convenience function to log server messages on the client
        const clientLog = function(...args){
            var array = ['Message from server:'];
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

    return io;

};
