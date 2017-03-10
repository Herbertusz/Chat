/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Chat-dobozok kezelése
 * @type {Object}
 */
CHAT.Components.Box = {

    /**
     * Doboz scrollozása az aljára
     * @param {HTMLElement} box - Chat-doboz
     * @param {Boolean} [conditional=false]
     */
    scrollToBottom : function(box, conditional = false){
        const list = HD.DOM(box).find(CHAT.DOM.list).elem();

        if (conditional){
            if (list.scrollHeight - list.offsetHeight - list.scrollTop < CHAT.Config.notification.local.scroll){
                list.scrollTop = list.scrollHeight;
            }
        }
        else {
            list.scrollTop = list.scrollHeight;
        }
    },

    /**
     * Doboz áthelyezése (drag-n-drop módon)
     */
    dragBox : function(){
        const Mover = CHAT.DOM.inBox(CHAT.DOM.dragMove);
        const Container = Mover.ancestor('body');
        const drag = {
            element : null,
            active : false,
            box : {x : 0, y : 0},
            mouse : {x : 0, y : 0}
        };

        Mover.event('mousedown', function(event){
            const element = HD.DOM(this).ancestor(CHAT.DOM.box).elem();
            event.preventDefault();
            drag.element = element;
            drag.active = true;
            drag.box.x = element.offsetLeft;
            drag.box.y = element.offsetTop;
            drag.mouse.x = event.pageX;
            drag.mouse.y = event.pageY;
            HD.DOM(CHAT.DOM.box).css({zIndex : 0});
            HD.DOM(drag.element).css({zIndex : 1000});
        });
        Container.event('mouseup', function(event){
            if (drag.active){
                event.preventDefault();
                drag.element = null;
                drag.active = false;
            }
        });
        Container.event('mousemove', function(event){
            if (drag.active){
                const element = drag.element;
                element.style.left = `${drag.box.x + event.pageX - drag.mouse.x}px`;
                element.style.top = `${drag.box.y + event.pageY - drag.mouse.y}px`;
            }
        });
    },

    /**
     * Doboz átméretezése (drag-n-drop módon)
     */
    resizeBox : function(){
        const Resizer = {
            all : CHAT.DOM.inBox(CHAT.DOM.dragResize.all),
            lt  : CHAT.DOM.inBox(CHAT.DOM.dragResize.lt).data('direction', 'lt'),
            rt  : CHAT.DOM.inBox(CHAT.DOM.dragResize.rt).data('direction', 'rt'),
            lb  : CHAT.DOM.inBox(CHAT.DOM.dragResize.lb).data('direction', 'lb'),
            rb  : CHAT.DOM.inBox(CHAT.DOM.dragResize.rb).data('direction', 'rb')
        };
        const Container = Resizer.all.ancestor('body');
        const drag = {
            element : null,
            trigger : null,
            active : false,
            box : {x : 0, y : 0, w : 0, h : 0},
            mouse : {x : 0, y : 0}
        };
        const rest = CHAT.Config.box.sizeRestriction;
        //if (!rest.minWidth) rest.minWidth = 0;

        Resizer.all.event('mousedown', function(event){
            const element = HD.DOM(this).ancestor(CHAT.DOM.box).elem();
            const size = element.getBoundingClientRect();
            event.preventDefault();
            drag.element = element;
            drag.trigger = HD.DOM(this).data('direction');
            drag.active = true;
            drag.box.x = element.offsetLeft;
            drag.box.y = element.offsetTop;
            drag.box.w = size.width;
            drag.box.h = size.height;
            drag.mouse.x = event.pageX;
            drag.mouse.y = event.pageY;
            HD.DOM(CHAT.DOM.box).css({zIndex : 0});
            HD.DOM(drag.element).css({zIndex : 1000});
        });
        Container.event('mouseup', function(event){
            if (drag.active){
                event.preventDefault();
                drag.element = null;
                drag.active = false;
            }
        });
        Container.event('mousemove', function(event){
            if (drag.active){
                const element = drag.element;
                let l, t, w, h;
                if (drag.trigger === 'lt'){
                    l = drag.box.x + event.pageX - drag.mouse.x;
                    t = drag.box.y + event.pageY - drag.mouse.y;
                    w = drag.box.w - event.pageX + drag.mouse.x;
                    h = drag.box.h - event.pageY + drag.mouse.y;
                }
                if (drag.trigger === 'rt'){
                    l = drag.box.x;
                    t = drag.box.y + event.pageY - drag.mouse.y;
                    w = drag.box.w + event.pageX - drag.mouse.x;
                    h = drag.box.h - event.pageY + drag.mouse.y;
                }
                if (drag.trigger === 'lb'){
                    l = drag.box.x + event.pageX - drag.mouse.x;
                    t = drag.box.y;
                    w = drag.box.w - event.pageX + drag.mouse.x;
                    h = drag.box.h + event.pageY - drag.mouse.y;
                }
                if (drag.trigger === 'rb'){
                    l = drag.box.x;
                    t = drag.box.y;
                    w = drag.box.w + event.pageX - drag.mouse.x;
                    h = drag.box.h + event.pageY - drag.mouse.y;
                }
                if (w > rest.minWidth && w < rest.maxWidth){
                    element.style.left = `${l}px`;
                    element.style.width = `${w}px`;
                }
                if (h > rest.minHeight && h < rest.maxHeight){
                    element.style.top = `${t}px`;
                    element.style.height = `${h}px`;
                }
            }
        });
    },

    /**
     * Doboz aktiválása/inaktiválása
     * @param {HTMLElement} box
     * @param {String} newStatus - 'enabled'|'disabled'
     */
    changeStatus : function(box, newStatus){
        const Box = HD.DOM(box);
        if (newStatus === 'enabled'){
            Box.find(CHAT.DOM.textarea).prop('disabled', false);
            Box.find(CHAT.DOM.userThrow).dataBool('disabled', false);
            Box.find(CHAT.DOM.fileTrigger).dataBool('disabled', false);
            Box.dataBool('disabled', false);
        }
        else if (newStatus === 'disabled'){
            Box.find(CHAT.DOM.textarea).prop('disabled', true);
            Box.find(CHAT.DOM.userThrow).dataBool('disabled', true);
            Box.find(CHAT.DOM.fileTrigger).dataBool('disabled', true);
            Box.dataBool('disabled', true);
        }
    },

    /**
     * Csatornák eseménykezelése
     */
    roomEvents : function(){
        // Csatorna létrehozása
        HD.DOM(CHAT.DOM.start).event('click', function(){
            CHAT.Events.Client.createRoom();
            HD.DOM(CHAT.DOM.userSelect).prop('checked', false).trigger('change');
        });

        // Kilépés csatornából
        CHAT.DOM.inBox(CHAT.DOM.close).event('click', function(){
            CHAT.Events.Client.leaveRoom(HD.DOM(this).ancestor(CHAT.DOM.box).elem());
        });

        // User hozzáadása csatornához
        HD.DOM(CHAT.DOM.userSelect).event('change', function(){
            if (HD.DOM(CHAT.DOM.selectedUsers).elements.length > 0){
                HD.DOM(CHAT.DOM.box).filter(':not([data-disabled])').find(CHAT.DOM.addUser).class('remove', 'hidden');
            }
            else {
                CHAT.DOM.inBox(CHAT.DOM.addUser).class('add', 'hidden');
            }
        });
        CHAT.DOM.inBox(CHAT.DOM.addUser).event('click', function(){
            const Add = HD.DOM(this);

            if (!Add.dataBool('disabled')){
                HD.DOM(CHAT.DOM.selectedUsers).elements.forEach(function(selectedUser){
                    CHAT.Events.Client.forceJoinRoom(Add.elem(), Number(selectedUser.value));
                });
                HD.DOM(CHAT.DOM.userSelect).prop('checked', false).trigger('change');
            }
        });

        // User kidobása csatornából
        CHAT.DOM.inBox(CHAT.DOM.userThrow).event('click', function(){
            const Remove = HD.DOM(this);

            if (!Remove.dataBool('disabled')){
                CHAT.Events.Client.forceLeaveRoom(Remove.elem());
            }
        });
    },

    /**
     * Doboz kitöltése DB-ből származó adatokkal
     * @param {HTMLElement} box
     * @param {String} roomName
     * @returns {Promise}
     */
    fill : function(box, roomName){

        HD.DOM.ajax({
            method : 'POST',
            url : '/chat/getroommessages',
            data : `roomName=${roomName}`
        }).then(function(resp){
            resp = JSON.parse(resp);
            let sequence = Promise.resolve();
            /**
             * Ajax válasz
             * @type {Object}
             * resp = {
             *     messages : [
             *         0 : {
             *             _id : ObjectID,
             *             userId : Number,
             *             userName : String,
             *             room : String,
             *             message : String|undefined,
             *             file : Object|undefined {
             *                 name : String,
             *                 size : Number,
             *                 type : String,
             *                 mainType : String,
             *                 store : String,
             *                 data : String,
             *                 deleted : Boolean
             *             },
             *             created : String
             *         }
             *     ]
             * }
             */
            resp.messages.forEach(function(msgData){
                sequence = sequence
                    .then(function(){
                        let data;
                        const timestamp = msgData.created;

                        if (HD.Misc.defined(msgData.message)){
                            // szöveges üzenet
                            CHAT.Components.Transfer.appendUserMessage(box, {
                                userId : msgData.userId,
                                time : timestamp,
                                message : msgData.message,
                                roomName : roomName
                            }, msgData.userId === CHAT.userId);
                            return Promise.resolve();
                        }
                        else if (HD.Misc.defined(msgData.file)){
                            // fájlküldés
                            data = {
                                userId : msgData.userId,
                                fileData : {
                                    name : msgData.file.name,
                                    size : msgData.file.size,
                                    type : msgData.file.type,
                                    deleted : msgData.file.deleted
                                },
                                file : null,
                                type : msgData.file.mainType,
                                time : timestamp,
                                roomName : roomName
                            };
                            return CHAT.FileTransfer.action('receive', [box, data, msgData]);
                        }
                        else {
                            // esemény
                            return Promise.resolve();
                        }
                    })
                    .catch(function(error){
                        HD.Log.error(error);
                    });
            });
        });

    }

};
