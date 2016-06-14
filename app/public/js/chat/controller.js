/* global HD */

"use strict";

var CHAT = window.CHAT || {};

$(document).ready(function(){

    var inBoxOld = function(selector){
        return $(CHAT.DOM.box).find(selector);
    };
    var inBox = function(selector){
        return HD.DOM.find(HD.DOM.get(CHAT.DOM.box), selector);
    };

    // Értesítések állapotának beállítása
    $(document).hover(function(){
        CHAT.notificationStatus = false;
        CHAT.Method.notification();
    }, function(){
        CHAT.notificationStatus = true;
    });

    // Csatorna létrehozása
    HD.DOM.event(HD.DOM.get(CHAT.DOM.start), "click", function(){
        CHAT.Events.Client.createRoom();
        HD.DOM.get(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
    });
    $(CHAT.DOM.start).click(function(){
        CHAT.Events.Client.createRoom();
        $(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
    });

    // Kilépés csatornából
    HD.DOM.event(inBox(CHAT.DOM.close), "click", function(){
        CHAT.Events.Client.leaveRoom($(this).parents(CHAT.DOM.box));
    });

    // User hozzáadása csatornához
    $(CHAT.DOM.userSelect).change(function(){
        if ($(CHAT.DOM.selectedUsers).length > 0){
            $(CHAT.DOM.box).filter(':not([data-disabled])').find(CHAT.DOM.addUser).show();
        }
        else {
            inBoxOld(CHAT.DOM.addUser).hide();
        }
    });
    inBoxOld(CHAT.DOM.addUser).click(function(){
        const $add = $(this);
        if (!$add.data("disabled")){
            $(CHAT.DOM.selectedUsers).each(function(){
                CHAT.Events.Client.forceJoinRoom($add, Number($(this).val()));
            });
            $(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
        }
    });

    // User kidobása csatornából
    inBoxOld(CHAT.DOM.userThrow).click(function(){
        const $remove = $(this);
        if (!$remove.data("disabled")){
            CHAT.Events.Client.forceLeaveRoom($remove);
        }
    });

    // Hibaüzenet eltüntetése
    inBoxOld(CHAT.DOM.errorClose).click(function(){
        $(this).parents(CHAT.DOM.box).find(CHAT.DOM.error).hide();
    });

    // Tétlen állapot
    $(CHAT.DOM.idleCheck).idleTimer(CHAT.timer.idle);
    $(CHAT.DOM.idleCheck).on("idle.idleTimer", function(){
        const connectedUsers = CHAT.Method.changeUserStatus("idle");
        CHAT.Method.updateStatuses(connectedUsers);
        CHAT.socket.emit('statusChanged', connectedUsers);
    });
    $(CHAT.DOM.idleCheck).on("active.idleTimer", function(){
        const connectedUsers = CHAT.Method.changeUserStatus("notidle");
        CHAT.Method.updateStatuses(connectedUsers);
        CHAT.socket.emit('statusChanged', connectedUsers);
    });

    // Státusz megváltoztatása
    $(CHAT.DOM.online).find(CHAT.DOM.statusChange).change(function(){
        const connectedUsers = CHAT.Method.changeUserStatus($(this).val());
        CHAT.Method.updateStatuses(connectedUsers);
        CHAT.socket.emit('statusChanged', connectedUsers);
    });

    // Üzenetküldés indítása ENTER leütésére
    inBoxOld(CHAT.DOM.message).keydown(function(event){
        const $box = $(this).parents('.chat');
        if (event.which === HD.Misc.keys.ENTER){
            if (!event.shiftKey && $box.find(CHAT.DOM.sendSwitch).prop("checked")){
                CHAT.Events.Client.sendMessage($box);
                event.preventDefault();
            }
        }
    });

    // Üzenetküldés indítása gombnyomásra
    inBoxOld(CHAT.DOM.sendButton).click(function(){
        const $box = $(this).parents('.chat');
        CHAT.Events.Client.sendMessage($box);
    });

    // Fájlküldés
    inBoxOld(CHAT.DOM.fileTrigger).click(function(){
        const $trigger = $(this);
        if (!$trigger.data("disabled")){
            $trigger.parents(CHAT.DOM.box).find(CHAT.DOM.file).trigger("click");
        }
    });
    inBoxOld(CHAT.DOM.file).change(function(){
        const $box = $(this).parents('.chat');
        const files = $box.find(CHAT.DOM.file).get(0).files;
        if (files.length > 0){
            CHAT.Events.Client.sendFile($box, files);
        }
    });
    $(CHAT.DOM.box).on('click', 'a.notredirect', function(event){
        // event.preventDefault();
    });

    // Fájlküldés (drag-n-drop)
    inBoxOld(CHAT.DOM.dropFile)
        .on(
            'drag dragstart dragend dragover dragenter dragleave drop',
            function(event){
                event.preventDefault();
                event.stopPropagation();
            }
        )
        .on('dragover dragenter', function(){
            $(this).addClass('drop-active');
        })
        .on('dragleave dragend drop', function(){
            $(this).removeClass('drop-active');
        })
        .on('drop', function(event){
            const $box = $(this).parents('.chat');
            const files = event.originalEvent.dataTransfer.files;
            CHAT.Events.Client.sendFile($box, files);
        });

    // Üzenet gépelése
    inBoxOld(CHAT.DOM.message).keyup(function(event){
        const $box = $(this).parents('.chat');
        if (event.which !== HD.Misc.keys.ENTER){
            CHAT.Events.Client.typeMessage($box);
        }
    });

    // Üzenetküldés módja
    inBoxOld(CHAT.DOM.sendSwitch).change(function(){
        CHAT.Events.Client.sendMethod($(this));
    });

    // User-sáv görgetése
    const userDrag = {
        active : false,
        moving : false,
        x : 0
    };
    inBoxOld(CHAT.DOM.users).mousedown(function(event){
        event.preventDefault();
        userDrag.active = true;
        userDrag.x = event.pageX;
    });
    inBoxOld(CHAT.DOM.users).on("mouseup mouseleave", function(event){
        event.preventDefault();
        userDrag.active = false;
        userDrag.moving = false;
    });
    inBoxOld(CHAT.DOM.users).mousemove(function(event){
        if (userDrag.active){
            if (userDrag.moving){
                $(this).scrollLeft(userDrag.x - event.pageX);
            }
            else {
                userDrag.moving = true;
                userDrag.x = $(this).scrollLeft() + event.pageX;
            }
        }
    });

    // Szerver által küldött események lekezelése
    let func;
    for (func in CHAT.Events.Server){
        CHAT.socket.on(func, CHAT.Events.Server[func]);
    }

});
