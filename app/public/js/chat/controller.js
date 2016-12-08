/* global HD */

'use strict';

var CHAT = window.CHAT || {};

/**
 * Rendszer vezérlése
 * @type {Object}
 */
CHAT.Controller = {

    /**
     * Felhasználói státuszok vezérlése
     */
    statusHandler : function(){
        // Státusz megváltoztatása
        HD.DOM(CHAT.DOM.online).find(CHAT.DOM.statusChange).event('change', function(){
            const connectedUsers = CHAT.Methods.changeUserStatus(this.value);
            CHAT.Methods.updateStatuses(connectedUsers);
            CHAT.socket.emit('statusChanged', connectedUsers);
        });

        if (CHAT.Config.idle.allowed){
            // Tétlen állapot TODO: saját kód
            $(CHAT.DOM.idleCheck).idleTimer(CHAT.timer.idle);
            $(CHAT.DOM.idleCheck).on('idle.idleTimer', function(){
                const connectedUsers = CHAT.Methods.changeUserStatus('idle');
                CHAT.Methods.updateStatuses(connectedUsers);
                CHAT.socket.emit('statusChanged', connectedUsers);
            });
            $(CHAT.DOM.idleCheck).on('active.idleTimer', function(){
                const connectedUsers = CHAT.Methods.changeUserStatus('notidle');
                CHAT.Methods.updateStatuses(connectedUsers);
                CHAT.socket.emit('statusChanged', connectedUsers);
            });
        }
    },

    /**
     * Csatornák vezérlése
     */
    roomHandler : function(){
        // Csatorna létrehozása
        HD.DOM(CHAT.DOM.start).event('click', function(){
            CHAT.Events.Client.createRoom();
            HD.DOM(CHAT.DOM.userSelect).prop('checked', false).trigger('change');
        });

        // Kilépés csatornából
        CHAT.Util.inBox(CHAT.DOM.close).event('click', function(){
            CHAT.Events.Client.leaveRoom(HD.DOM(this).ancestor(CHAT.DOM.box).elem());
        });

        // User hozzáadása csatornához
        HD.DOM(CHAT.DOM.userSelect).event('change', function(){
            if (HD.DOM(CHAT.DOM.selectedUsers).elements.length > 0){
                HD.DOM(CHAT.DOM.box).filter(':not([data-disabled])').find(CHAT.DOM.addUser).class('remove', 'hidden');
            }
            else {
                CHAT.Util.inBox(CHAT.DOM.addUser).class('add', 'hidden');
            }
        });
        CHAT.Util.inBox(CHAT.DOM.addUser).event('click', function(){
            const Add = HD.DOM(this);

            if (!Add.dataBool('disabled')){
                HD.DOM(CHAT.DOM.selectedUsers).elements.forEach(function(selectedUser){
                    CHAT.Events.Client.forceJoinRoom(Add.elem(), Number(selectedUser.value));
                });
                HD.DOM(CHAT.DOM.userSelect).prop('checked', false).trigger('change');
            }
        });

        // User kidobása csatornából
        CHAT.Util.inBox(CHAT.DOM.userThrow).event('click', function(){
            const Remove = HD.DOM(this);

            if (!Remove.dataBool('disabled')){
                CHAT.Events.Client.forceLeaveRoom(Remove.elem());
            }
        });
    },

    /**
     * Értesítések vezérlése
     */
    notificationHandler : function(){
        // Értesítések állapotának beállítása
        HD.DOM('body')
            .event('mouseenter', function(){
                CHAT.notificationStatus = false;
                CHAT.Methods.notification();
            })
            .event('mouseleave', function(){
                CHAT.notificationStatus = true;
            });

        // Helyi értesítés eltüntetése
        CHAT.Util.inBox(CHAT.DOM.list).event('scroll', function(){
            if (this.scrollHeight - this.offsetHeight - this.scrollTop < CHAT.Config.notification.local.scroll){
                HD.DOM(this).ancestor(CHAT.DOM.box).find(CHAT.DOM.localNotification).class('add', 'hidden');
            }
        });
        // Hibaüzenet eltüntetése
        CHAT.Util.inBox(CHAT.DOM.errorClose).event('click', function(){
            HD.DOM(this).ancestor(CHAT.DOM.box).find(CHAT.DOM.error).class('add', 'hidden');
        });
    },

    /**
     * User-sáv görgetése
     */
    userBarDrag : function(){
        const userDrag = {
            active : false,
            moving : false,
            x : 0
        };

        CHAT.Util.inBox(CHAT.DOM.users).event('mousedown', function(event){
            event.preventDefault();
            userDrag.active = true;
            userDrag.x = event.pageX;
        });
        CHAT.Util.inBox(CHAT.DOM.users).event('mouseup mouseleave', function(event){
            event.preventDefault();
            userDrag.active = false;
            userDrag.moving = false;
        });
        CHAT.Util.inBox(CHAT.DOM.users).event('mousemove', function(event){
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
    },

    /**
     * Üzenetküldés vezérlése
     */
    sendMessage : function(){
        // Üzenet gépelése
        CHAT.Util.inBox(CHAT.DOM.textarea).event('keyup', function(event){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);

            if (event.which !== HD.Misc.keys.ENTER){
                CHAT.Events.Client.typeMessage(Box.elem());
            }
        });

        // Üzenetküldés indítása ENTER leütésére
        CHAT.Util.inBox(CHAT.DOM.textarea).event('keydown', function(event){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);

            if (event.which === HD.Misc.keys.ENTER){
                if (!event.shiftKey && Box.find(CHAT.DOM.sendSwitch).prop('checked')){
                    CHAT.Events.Client.sendMessage(Box.elem());
                    event.preventDefault();
                }
            }
        });

        // Üzenetküldés indítása gombnyomásra
        CHAT.Util.inBox(CHAT.DOM.sendButton).event('click', function(){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
            CHAT.Events.Client.sendMessage(Box.elem());
        });

        // Üzenetküldés módja
        CHAT.Util.inBox(CHAT.DOM.sendSwitch).event('change', function(){
            CHAT.Events.Client.sendMethod(this);
        });
    },

    /**
     * Fájlátvitel vezérlése
     */
    fileTransfer : function(){
        // Fájlküldés (hagyományos)
        CHAT.Util.inBox(CHAT.DOM.fileTrigger).event('click', function(){
            const Trigger = HD.DOM(this);

            if (!Trigger.dataBool('disabled')){
                Trigger.ancestor(CHAT.DOM.box).find(CHAT.DOM.file).trigger('click');
            }
        });
        CHAT.Util.inBox(CHAT.DOM.file).event('change', function(){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
            const files = Box.find(CHAT.DOM.file).elem().files;

            if (files.length > 0){
                CHAT.Events.Client.sendFile(Box.elem(), files);
            }
        });

        // Fájlküldés (drag-n-drop)
        CHAT.Util.inBox(CHAT.DOM.dropFile)
            .event(
                'drag dragstart dragend dragover dragenter dragleave drop',
                function(event){
                    event.preventDefault();
                    event.stopPropagation();
                }
            )
            .event('dragover dragenter', function(){
                HD.DOM(this).class('add', 'drop-active');
            })
            .event('dragleave dragend drop', function(){
                HD.DOM(this).class('remove', 'drop-active');
            })
            .event('drop', function(event){
                const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
                const files = event.dataTransfer.files;
                CHAT.Events.Client.sendFile(Box.elem(), files);
            });
    }

};

HD.DOM(document).event('DOMContentLoaded', function(){

    CHAT.Controller.statusHandler();
    CHAT.Controller.roomHandler();
    CHAT.Controller.userBarDrag();
    CHAT.Controller.sendMessage();

    if (CHAT.Config.notification.allowed){
        CHAT.Controller.notificationHandler();
    }
    if (CHAT.Config.fileTransfer.allowed){
        CHAT.Controller.fileTransfer();
    }

    // Szerver által küldött események lekezelése
    let func;
    for (func in CHAT.Events.Server){
        CHAT.socket.on(func, CHAT.Events.Server[func]);
    }

});
