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
        const list = HD.DOM(box).descendants(CHAT.DOM.list).elem();

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
    dragPosition : function(){
        const Mover = CHAT.DOM.inBox(CHAT.DOM.dragMove);
        const Container = Mover.ancestors('body');
        const drag = {
            element : null,
            active : false,
            box : {x : 0, y : 0},
            mouse : {x : 0, y : 0}
        };

        Mover.event('mousedown', function(event){
            const element = HD.DOM(this).ancestors(CHAT.DOM.box).elem();
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
    dragResize : function(){
        const Resizer = {
            all : CHAT.DOM.inBox(CHAT.DOM.dragResize.all),
            lt  : CHAT.DOM.inBox(CHAT.DOM.dragResize.lt).data('direction', 'lt'),
            rt  : CHAT.DOM.inBox(CHAT.DOM.dragResize.rt).data('direction', 'rt'),
            lb  : CHAT.DOM.inBox(CHAT.DOM.dragResize.lb).data('direction', 'lb'),
            rb  : CHAT.DOM.inBox(CHAT.DOM.dragResize.rb).data('direction', 'rb')
        };
        const Container = Resizer.all.ancestors('body');
        const drag = {
            element : null,
            trigger : null,
            active : false,
            box : {x : 0, y : 0, w : 0, h : 0},
            mouse : {x : 0, y : 0}
        };
        const rest = CHAT.Config.box.sizeRestriction;
        if (!rest.minWidth) rest.minWidth = 0;
        if (!rest.minHeight) rest.minHeight = 0;
        if (!rest.maxWidth) rest.maxWidth = Infinity;
        if (!rest.maxHeight) rest.maxHeight = Infinity;

        Resizer.all.event('mousedown', function(event){
            const element = HD.DOM(this).ancestors(CHAT.DOM.box).elem();
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
            HD.DOM(CHAT.DOM.box).css({
                zIndex : 0
            });
            HD.DOM(drag.element).css({
                position : 'absolute',
                zIndex : 1000
            });
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
                else if (drag.trigger === 'rt'){
                    l = drag.box.x;
                    t = drag.box.y + event.pageY - drag.mouse.y;
                    w = drag.box.w + event.pageX - drag.mouse.x;
                    h = drag.box.h - event.pageY + drag.mouse.y;
                }
                else if (drag.trigger === 'lb'){
                    l = drag.box.x + event.pageX - drag.mouse.x;
                    t = drag.box.y;
                    w = drag.box.w - event.pageX + drag.mouse.x;
                    h = drag.box.h + event.pageY - drag.mouse.y;
                }
                else if (drag.trigger === 'rb'){
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
     * Doboz átméretezése (előredefiniált méretekre)
     */
    clickResize : function(){
        const ResizerContainer = HD.DOM(CHAT.DOM.clickResize);
        const Resizers = ResizerContainer.descendants('*').getByData('resize');
        const containerSize = HD.DOM(CHAT.DOM.container).elem().getBoundingClientRect();
        const definedSizes = {
            box : {
                position : 'absolute',
                left : 0,
                top : 0,
                width : `${CHAT.Config.box.defaultSize.width}px`,
                height : `${CHAT.Config.box.defaultSize.height}px`
            },
            container : {
                position : 'absolute',
                left : 0,
                top : 0,
                width : `${containerSize.width}px`,
                height : `${containerSize.height}px`
            },
            window : {
                position : 'fixed',
                left : 0,
                top : 0,
                width : '100%',
                height : '100%'
            },
            screen : {
                left : 0,
                top : 0,
                width : '100%',
                height : '100%'
            }
        };

        CHAT.DOM.inBox(`${CHAT.DOM.clickResize} .toggle`).event('click', function(){
            HD.DOM(this).ancestors(CHAT.DOM.clickResize).descendants('.actions').class('toggle', 'active');
        });

        Resizers.event('click', function(){
            const Trigger = HD.DOM(this);
            const Box = Trigger.ancestors(CHAT.DOM.box);
            const size = Trigger.data('resize');
            if (size === 'box'){
                CHAT.DOM.inVisibleBox(CHAT.DOM.dragResize.all).css({
                    display : 'inline-block'
                });
            }
            else {
                CHAT.DOM.inVisibleBox(CHAT.DOM.dragResize.all).css({
                    display : 'none'
                });
            }
            if (size !== 'screen' && definedSizes[size]){
                const exitFullscreen =
                    document.exitFullscreen ||
                    document.webkitExitFullscreen ||
                    document.mozExitFullscreen ||
                    document.msExitFullscreen;
                if (exitFullscreen){
                    exitFullscreen.call(document);
                }
                Box.css(definedSizes[size]);
            }
            else if (size === 'screen'){
                const box = Box.elem();
                const requestFullscreen =
                    box.requestFullscreen ||
                    box.webkitRequestFullscreen ||
                    box.mozRequestFullscreen ||
                    box.msRequestFullscreen;
                if (requestFullscreen){
                    Box.css(definedSizes[size]);
                    requestFullscreen.call(box);
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
            Box.descendants(CHAT.DOM.textarea).prop('disabled', false);
            Box.descendants(CHAT.DOM.userThrow).dataBool('disabled', false);
            Box.descendants(CHAT.DOM.fileTrigger).dataBool('disabled', false);
            Box.dataBool('disabled', false);
        }
        else if (newStatus === 'disabled'){
            Box.descendants(CHAT.DOM.textarea).prop('disabled', true);
            Box.descendants(CHAT.DOM.userThrow).dataBool('disabled', true);
            Box.descendants(CHAT.DOM.fileTrigger).dataBool('disabled', true);
            Box.dataBool('disabled', true);
        }
    },

    /**
     * Csatornák eseménykezelése
     */
    roomEvents : function(){
        // Csatorna létrehozása
        HD.DOM(CHAT.DOM.start).event('click', function(){
            const room = CHAT.Events.Client.createRoom();
            HD.DOM(CHAT.DOM.userSelect).prop('checked', false).trigger('change');
            CHAT.DOM.setTitle(`[data-room="${room}"]`);
        });

        // Kilépés csatornából
        CHAT.DOM.inBox(CHAT.DOM.close).event('click', function(){
            CHAT.Events.Client.leaveRoom(HD.DOM(this).ancestors(CHAT.DOM.box).elem());
        });

        // User hozzáadása csatornához
        HD.DOM(CHAT.DOM.userSelect).event('change', function(){
            if (HD.DOM(CHAT.DOM.selectedUsers).elements.length > 0){
                HD.DOM(CHAT.DOM.box)
                    .filter(':not([data-disabled])')
                    .descendants(CHAT.DOM.addUser)
                    .class('remove', 'hidden');
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
                CHAT.DOM.setTitle(CHAT.DOM.box);
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
             *                 raw : {
             *                     name : String,
             *                     size : Number,
             *                     type : String,
             *                     source : String
             *                 },
             *                 store : String,
             *                 type : String,
             *                 name : String,
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
                                raw : {
                                    name : msgData.file.raw.name,
                                    size : msgData.file.raw.size,
                                    type : msgData.file.raw.type,
                                    source : msgData.file.raw.source
                                },
                                store : msgData.file.store,
                                type : msgData.file.type,
                                time : timestamp,
                                roomName : roomName,
                                name : msgData.file.name,
                                deleted : msgData.file.deleted
                            };
                            return CHAT.FileTransfer.action('receive', [box, data]);
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
