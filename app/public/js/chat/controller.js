/* global HD */

"use strict";

var CHAT = window.CHAT || {};

HD.DOM(document).event("DOMContentLoaded", function(){

    /**
     * Chat-dobozon belüli elemek
     * @param {String} selector
     * @returns {HD.DOM}
     */
    var inBox = function(selector){
        return HD.DOM(CHAT.DOM.box).find(selector);
    };

    // Értesítések állapotának beállítása
    HD.DOM("body")
        .event("mouseenter", function(){
            CHAT.notificationStatus = false;
            CHAT.Method.notification();
        }).event("mouseleave", function(){
            CHAT.notificationStatus = true;
        });

    // Csatorna létrehozása
    HD.DOM(CHAT.DOM.start).event("click", function(){
        CHAT.Events.Client.createRoom();
        HD.DOM(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
    });

    // Kilépés csatornából
    inBox(CHAT.DOM.close).event("click", function(){
        CHAT.Events.Client.leaveRoom(HD.DOM(this).ancestor(CHAT.DOM.box).elem());
    });

    // User hozzáadása csatornához
    HD.DOM(CHAT.DOM.userSelect).event("change", function(){
        if (HD.DOM(CHAT.DOM.selectedUsers).elements.length > 0){
            HD.DOM(CHAT.DOM.box).filter(':not([data-disabled])').find(CHAT.DOM.addUser).class("remove", "hidden");
        }
        else {
            inBox(CHAT.DOM.addUser).class("add", "hidden");
        }
    });
    inBox(CHAT.DOM.addUser).event("click", function(){
        const Add = HD.DOM(this);
        if (!Add.dataBool("disabled")){
            HD.DOM(CHAT.DOM.selectedUsers).elements.forEach(function(selectedUser){
                CHAT.Events.Client.forceJoinRoom(Add.elem(), Number(selectedUser.value));
            });
            HD.DOM(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
        }
    });

    // User kidobása csatornából
    inBox(CHAT.DOM.userThrow).event("click", function(){
        const Remove = HD.DOM(this);
        if (!Remove.dataBool("disabled")){
            CHAT.Events.Client.forceLeaveRoom(Remove.elem());
        }
    });

    // Hibaüzenet eltüntetése
    inBox(CHAT.DOM.errorClose).event("click", function(){
        HD.DOM(this).ancestor(CHAT.DOM.box).find(CHAT.DOM.error).class("add", "hidden");
    });

    // Tétlen állapot TODO: saját kód
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
    HD.DOM(CHAT.DOM.online).find(CHAT.DOM.statusChange).event("change", function(){
        const connectedUsers = CHAT.Method.changeUserStatus(this.value);
        CHAT.Method.updateStatuses(connectedUsers);
        CHAT.socket.emit('statusChanged', connectedUsers);
    });

    // Üzenetküldés indítása ENTER leütésére
    inBox(CHAT.DOM.message).event("keydown", function(event){
        const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
        if (event.which === HD.Misc.keys.ENTER){
            if (!event.shiftKey && Box.find(CHAT.DOM.sendSwitch).prop("checked")){
                CHAT.Events.Client.sendMessage(Box.elem());
                event.preventDefault();
            }
        }
    });

    // Üzenetküldés indítása gombnyomásra
    inBox(CHAT.DOM.sendButton).event("click", function(){
        const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
        CHAT.Events.Client.sendMessage(Box.elem());
    });

    // Fájlküldés (hagyományos)
    inBox(CHAT.DOM.fileTrigger).event("click", function(){
        const Trigger = HD.DOM(this);
        if (!Trigger.dataBool("disabled")){
            Trigger.ancestor(CHAT.DOM.box).find(CHAT.DOM.file).trigger("click");
        }
    });
    inBox(CHAT.DOM.file).event("change", function(){
        const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
        const files = Box.find(CHAT.DOM.file).elem().files;
        if (files.length > 0){
            CHAT.Events.Client.sendFile(Box.elem(), files);
        }
    });

    // Fájlküldés (drag-n-drop)
    inBox(CHAT.DOM.dropFile)
        .event(
            "drag dragstart dragend dragover dragenter dragleave drop",
            function(event){
                event.preventDefault();
                event.stopPropagation();
            }
        )
        .event("dragover dragenter", function(){
            HD.DOM(this).class("add", "drop-active");
        })
        .event("dragleave dragend drop", function(){
            HD.DOM(this).class("remove", "drop-active");
        })
        .event("drop", function(event){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
            const files = event.dataTransfer.files;
            CHAT.Events.Client.sendFile(Box.elem(), files);
        });

    // Üzenet gépelése
    inBox(CHAT.DOM.message).event("keyup", function(event){
        const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
        if (event.which !== HD.Misc.keys.ENTER){
            CHAT.Events.Client.typeMessage(Box.elem());
        }
    });

    // Üzenetküldés módja
    inBox(CHAT.DOM.sendSwitch).event("change", function(){
        CHAT.Events.Client.sendMethod(this);
    });

    // User-sáv görgetése
    const userDrag = {
        active : false,
        moving : false,
        x : 0
    };
    inBox(CHAT.DOM.users).event("mousedown", function(event){
        event.preventDefault();
        userDrag.active = true;
        userDrag.x = event.pageX;
    });
    inBox(CHAT.DOM.users).event("mouseup mouseleave", function(event){
        event.preventDefault();
        userDrag.active = false;
        userDrag.moving = false;
    });
    inBox(CHAT.DOM.users).event("mousemove", function(event){
        if (userDrag.active){
            if (userDrag.moving){
                this.scrollLeft = userDrag.x - event.pageX;
            }
            else {
                userDrag.moving = true;
                userDrag.x = this.scrollLeft + event.pageX;
            }
        }
    });

    // Szerver által küldött események lekezelése
    let func;
    for (func in CHAT.Events.Server){
        CHAT.socket.on(func, CHAT.Events.Server[func]);
    }

});
