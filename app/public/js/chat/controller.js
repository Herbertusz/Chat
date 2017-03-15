/* global HD */

'use strict';

var CHAT = window.CHAT || {};

// Rendszer vezérlése
HD.DOM(document).event('DOMContentLoaded', function(){

    CHAT.Components.Box.roomEvents();
    CHAT.Components.Box.dragBox();
    CHAT.Components.Box.resizeBox();
    CHAT.Components.User.statusEvents();
    CHAT.Components.User.openList();
    CHAT.Components.Transfer.initMessage();

    if (CHAT.Config.fileTransfer.allowed){
        CHAT.Components.Transfer.initFile();
    }
    if (CHAT.Config.notification.allowed){
        CHAT.Components.Notification.init();
    }

    // Szerver által küldött események lekezelése
    let func;
    for (func in CHAT.Events.Server){
        CHAT.socket.on(func, CHAT.Events.Server[func]);
    }

});
