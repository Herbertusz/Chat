# Chat
Chat alkalmazás (Node.js, Socket.io)

CHAT.Components = {
    Timer : {
        writing : {},
        idle : 0,
        counters : {}
    },
    Transfer : {
        escapeHtml : function(string){},
        replaceMessage : function(message){},
        appendUserMessage : function(box, data, highlighted){},
        appendSystemMessage : function(box, type, fromId, toId){},
        appendFile : function(box, data, highlighted){},
        progressbar : function(box, direction, percent, barId, cancelable){},
        progress : function(box, operation){}
    },
    Notification : {
        status : false,
        error : function(box, errors){},
        stillWrite : function(box, userId){},
        stopWrite : function(box, userId, message){},
        notification : function(box, data){}
    },
    User : {
        getName : function(userId){},
        generateList : function(to, userIds, regenerate){},
        setStatus : function(elem, status){},
        getStatus : function(elem){},
        updateStatuses : function(connectedUsers){},
        changeStatus : function(newStatus){},
        setTimer : function(elem, prevStatus, nextStatus){},
        timerDisplay : function(segmentString, min){}
    },
    Box : {
        scrollToBottom : function(box, conditional){},
        changeStatus : function(box, newStatus){},
        fill : function(box, roomName){}
    }
};
