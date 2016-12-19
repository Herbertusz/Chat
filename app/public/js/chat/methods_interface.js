/* global HD */

'use strict';

var CHAT = window.CHAT || {};

CHAT.Labels = {};

CHAT.Methods = {
    Timers : {
        writing : { // util
            timerID : 0,
            interval : 1000,
            event : false,
            message : ''
        },
        idle : CHAT.Config.idle.time, // util
        counters : {} // Methods.timers
    },
    Transfer : {
        escapeHtml : function(string){}, // util
        replaceMessage : function(message){},
        appendUserMessage : function(box, data, highlighted){},
        appendSystemMessage : function(box, type, fromId, toId){},
        appendFile : function(box, data, highlighted){},
        progressbar : function(box, direction, percent, barId, cancelable){},
        progress : function(box, operation){}
    },
    Notification : {
        notificationStatus : false, // util
        stillWrite : function(box, userId){},
        stopWrite : function(box, userId, message){},
        notification : function(box, data){}
    },
    Error : {
        showError : function(box, errors){}
    },
    User : {
        getUserName : function(userId){},
        generateUserList : function(to, userIds, regenerate){},
        setStatus : function(elem, status){},
        getStatus : function(elem){},
        updateStatuses : function(connectedUsers){},
        changeUserStatus : function(newStatus){},
        setTimer : function(elem, prevStatus, nextStatus){},
        timerDisplay : function(segmentString, min){}
    },
    Box : {
        scrollToBottom : function(box, conditional){}, // util
        changeBoxStatus : function(box, newStatus){},
        fillBox : function(box, roomName){}
    }
};
