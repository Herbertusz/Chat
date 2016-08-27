/* global SERVER, io */

'use strict';

var isInitiator;
var room = prompt('Enter room name:');
// var socket = io.connect();
var socket = io.connect(`http://${SERVER.domain}:${SERVER.wsport}/videochat`);

if (room !== ""){
    console.log(`Message from client: Asking to join room ${room}`);
    socket.emit('create or join', room);
}

socket.on('created', function(channel, clientId){
    isInitiator = true;
});

socket.on('full', function(channel){
    console.log(`Message from client: Room ${channel} is full!`);
});

socket.on('joined', function(channel, clientId){
    console.log(`${clientId} joined to ${channel}`);
    isInitiator = false;
});

socket.on('log', function(array){
    console.log(...array);
});
