"use strict";

var constraints = {
    video : true,
    audio : false
};

document.addEventListener('DOMContentLoaded', function(){

    var video = document.querySelector('video');

    var successCallback = function(stream){
        console.log(stream.getVideoTracks());
        video.src = window.URL ? window.URL.createObjectURL(stream) : stream;
    };

    var errorCallback = function(error){
        console.log('navigator.getUserMedia error: ', error);
    };

    if (navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices.getUserMedia(constraints)
            .then(successCallback)
            .catch(errorCallback);
    }
    else {
        navigator.webkitGetUserMedia(constraints, successCallback, errorCallback);
    }

}, false);
