/* global SERVER, io, RTCPeerConnection */

'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
    'iceServers' : [{
        'url' : 'stun:stun.l.google.com:19302'
    }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    'mandatory' : {
        'OfferToReceiveAudio' : true,
        'OfferToReceiveVideo' : true
    }
};

const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');

// ---------------------------------------

var roomName = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect(`http://${SERVER.domain}:${SERVER.wsport}/videochat`);

if (roomName !== ''){
    socket.emit('create or join', roomName);
    console.log('Attempted to create or  join room', roomName);
}

socket.on('created', function(room){
    console.log(`Created room ${room}`);
    isInitiator = true;
});

socket.on('full', function(room){
    console.log(`Room ${room} is full`);
});

socket.on('join', function(room){
    console.log(`Another peer made a request to join room ${room}`);
    console.log(`This peer is the initiator of room ${room}!`);
    isChannelReady = true;
});

socket.on('joined', function(room){
    console.log(`joined: ${room}`);
    isChannelReady = true;
});

socket.on('log', function(array){
    console.log(...array);
});

const sendMessage = function(message){
    console.log('Client sending message: ', message);
    socket.emit('message', message);
};

// ---------------------------------------

/*
const extractSdp = function(sdpLine, pattern){
    var result = sdpLine.match(pattern);
    return result && result.length === 2 ? result[1] : null;
};

// Set the selected codec to the first in m line.
const setDefaultCodec = function(mLine, payload){
    var elements = mLine.split(' ');
    var newLine = [];
    var index = 0;
    for (let i = 0; i < elements.length; i++){
        if (index === 3){ // Format of media starts from the fourth.
            newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload){
            newLine[index++] = elements[i];
        }
    }
    return newLine.join(' ');
};

// Strip CN from sdp before CN constraints is ready.
const removeCN = function(sdpLines, mLineIndex){
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (let i = sdpLines.length - 1; i >= 0; i--){
        const payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload){
            const cnPos = mLineElements.indexOf(payload);
            if (cnPos !== -1){
                // Remove CN payload from m line.
                mLineElements.splice(cnPos, 1);
            }
            // Remove CN line in sdp
            sdpLines.splice(i, 1);
        }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
};

// Set Opus as the default audio codec if it's present.
const preferOpus = function(sdp){
    var sdpLines = sdp.split('\r\n');
    var mLineIndex;
    // Search for m line.
    for (let i = 0; i < sdpLines.length; i++){
        if (sdpLines[i].search('m=audio') !== -1){
            mLineIndex = i;
            break;
        }
    }
    if (mLineIndex === null){
        return sdp;
    }

    // If Opus is available, set it as the default in m line.
    for (let i = 0; i < sdpLines.length; i++){
        if (sdpLines[i].search('opus/48000') !== -1){
            const opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
            if (opusPayload){
                sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
                    opusPayload);
            }
            break;
        }
    }

    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
};
*/

// ---------------------------------------

const handleIceCandidate = function(event){
    console.log('icecandidate event: ', event);
    if (event.candidate){
        sendMessage({
            type : 'candidate',
            label : event.candidate.sdpMLineIndex,
            id : event.candidate.sdpMid,
            candidate : event.candidate.candidate
        });
    }
    else {
        console.log('End of candidates.');
    }
};

const handleRemoteStreamAdded = function(event){
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
};

const handleRemoteStreamRemoved = function(event){
    console.log('Remote stream removed. Event: ', event);
};

const createPeerConnection = function(){
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    }
    catch (e){
        console.log(`Failed to create PeerConnection, exception: ${e.message}`);
    }
};

const setLocalAndSendMessage = function(sessionDescription){
    // Set Opus as the preferred codec in SDP if Opus is present.
    //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
};

const requestTurn = function(turnURL){
    let turnExists = false;
    let i;
    for (i in pcConfig.iceServers){
        if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:'){
            turnExists = true;
            turnReady = true;
            break;
        }
    }
    if (!turnExists){
        console.log('Getting TURN server from ', turnURL);
        // No TURN server. Get one from computeengineondemand.appspot.com:
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4 && xhr.status === 200){
                const turnServer = JSON.parse(xhr.responseText);
                console.log('Got TURN server: ', turnServer);
                pcConfig.iceServers.push({
                    'url' : `turn:${turnServer.username}@${turnServer.turn}`,
                    'credential' : turnServer.password
                });
                turnReady = true;
            }
        };
        xhr.open('GET', turnURL, true);
        xhr.send();
    }
};

const stop = function(){
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    pc.close();
    pc = null;
};

const hangup = function(){
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
};

const handleRemoteHangup = function(){
    console.log('Session terminated.');
    stop();
    isInitiator = false;
};

const maybeStart = function(){
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (typeof localStream !== 'undefined'){
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator){
            console.log('Sending offer to peer');
            pc.createOffer(setLocalAndSendMessage, function(event){
                console.log('createOffer() error: ', event);
            });
        }
    }
};

// ---------------------------------------

// This client receives a message
socket.on('message', function(message){
    console.log('Client received message:', message);
    if (message === 'got user media'){
        maybeStart();
    }
    else if (message.type === 'offer'){
        if (!isInitiator && !isStarted){
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        console.log('Sending answer to peer.');
        pc.createAnswer().then(
            setLocalAndSendMessage,
            function(error){
                console.log(`Failed to create session description: ${error.toString()}`);
            }
        );
    }
    else if (message.type === 'answer' && isStarted){
        pc.setRemoteDescription(new RTCSessionDescription(message));
    }
    else if (message.type === 'candidate' && isStarted){
        const candidate = new RTCIceCandidate({
            sdpMLineIndex : message.label,
            candidate : message.candidate
        });
        pc.addIceCandidate(candidate);
    }
    else if (message === 'bye' && isStarted){
        handleRemoteHangup();
    }
});

// ---------------------------------------

navigator.mediaDevices.getUserMedia({
    audio : false,
    video : true
})
    .then(function(stream){
        console.log('Adding local stream.');
        localVideo.src = window.URL.createObjectURL(stream);
        localStream = stream;
        sendMessage('got user media');
        if (isInitiator){
            maybeStart();
        }
    })
    .catch(function(e){
        console.log(`getUserMedia() error: ${e.name}`);
    });


const constraints = {
    video : true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost'){
    requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
}

window.onbeforeunload = function(){
    sendMessage('bye');
};
