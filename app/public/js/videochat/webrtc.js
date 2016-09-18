/* global HD, RTCMultiConnection */

"use strict";

HD.DOM(document).event("DOMContentLoaded", function(){

    const connection = new RTCMultiConnection();

    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
    connection.socketMessageEvent = 'rtc-message';

    connection.session = {
        audio : true,
        video : true
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio : true,
        OfferToReceiveVideo : true
    };

    connection.onstream = function(event){
        HD.DOM('#webcam').elem().appendChild(event.mediaElement);
    };

    const predefinedRoomId = 'Herbertusz';

    HD.DOM('#btn-open-room').event("click", function(){
        this.disabled = true;
        connection.open(predefinedRoomId);
    });

    HD.DOM('#btn-join-room').event("click", function(){
        this.disabled = true;
        connection.join(predefinedRoomId);
    });

});
