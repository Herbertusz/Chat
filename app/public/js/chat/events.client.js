/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Events = CHAT.Events || {};

/**
 * Kliens által küldött események kezelése
 * @type {Object}
 */
CHAT.Events.Client = {

    /**
     * Csatorna létrehozása
     * @param {Array} selectedUserIds - kiválasztott userId-k
     * @returns {String} csatona azonosítója
     */
    createRoom : function(selectedUserIds){
        const Box = HD.DOM(
            HD.DOM(CHAT.DOM.cloneBox).copyPaste(HD.DOM(CHAT.DOM.container).elem())
        );
        const Userlist = Box.descendants(CHAT.DOM.users);
        const userIds = [CHAT.userId, ...selectedUserIds];

        Box.css({
            width : `${CHAT.Config.box.defaultSize.width}px`,
            height : `${CHAT.Config.box.defaultSize.height}px`
        });
        CHAT.Components.User.generateList(Userlist.elem(), userIds);
        const room = `room-${CHAT.userId}-${Date.now()}`;
        Box.data('room', room);
        CHAT.socket.emit('roomCreated', {
            triggerId : CHAT.userId,
            userId : userIds,
            room : room
        });
        return room;
    },

    /**
     * Kilépés csatornából
     * @param {HTMLElement} box
     */
    leaveRoom : function(box){
        const Box = HD.DOM(box);
        const room = Box.data('room');

        Box.remove();
        CHAT.socket.emit('roomLeave', {
            triggerId : CHAT.userId,
            userId : CHAT.userId,
            room : room
        });
    },

    /**
     * User hozzáadása csatornához
     * @param {HTMLElement} add
     * @param {Number} userId
     */
    forceJoinRoom : function(add, userId){
        const Box = HD.DOM(add).ancestors(CHAT.DOM.box);
        const Userlist = Box.descendants(CHAT.DOM.users);
        const currentUserIds = [];
        const room = Box.data('room');

        Userlist.descendants(CHAT.DOM.userItems).filter(':not(.cloneable)').elements.forEach(function(user){
            currentUserIds.push(HD.DOM(user).dataNum('id'));
        });
        if (currentUserIds.indexOf(userId) === -1){
            CHAT.Components.User.generateList(Userlist.elem(), [userId]);
            CHAT.socket.emit('roomForceJoin', {
                triggerId : CHAT.userId,
                userId : userId,
                room : room
            });
        }
    },

    /**
     * User kidobása csatornából
     * @param {HTMLElement} close
     */
    forceLeaveRoom : function(close){
        const Close = HD.DOM(close);
        const Box = Close.ancestors(CHAT.DOM.box);
        const User = Close.ancestors(CHAT.DOM.userItems);
        const room = Box.data('room');
        const userId = User.dataNum('id');

        if (userId === CHAT.userId){
            // kilépés
            Box.remove();
            CHAT.socket.emit('roomLeave', {
                triggerId : CHAT.userId,
                userId : CHAT.userId,
                room : room
            });
        }
        else {
            // másik felhasználó kidobása
            User.remove();
            CHAT.socket.emit('roomForceLeave', {
                triggerId : CHAT.userId,
                userId : userId,
                room : room
            });
        }
    },

    /**
     * Üzenetküldés
     * @param {HTMLElement} box
     */
    sendMessage : function(box){
        const Box = HD.DOM(box);
        const Message = Box.descendants(CHAT.DOM.textarea);
        const data = {
            userId : CHAT.userId,
            room : Box.data('room'),
            message : Message.elem().value,
            time : Date.now()
        };

        if (data.message.trim().length > 0){
            CHAT.socket.emit('sendMessage', data);
            CHAT.Components.Transfer.appendUserMessage(box, data, true);
            CHAT.Components.Box.scrollToBottom(box);
            Box.descendants(CHAT.DOM.textarea).elem().value = '';
        }
    },

    /**
     * Fájlküldés
     * @param {HTMLElement} box
     * @param {Object} files - FileList objektum
     */
    sendFile : function(box, files){
        if (!CHAT.Config.fileTransfer.multiple){
            files = [files[0]];
        }
        else {
            files = [...files];
        }

        const filePrepare = function(rawFile){
            const store = CHAT.FileTransfer.getStore(rawFile.size);
            const fileData = {
                userId : CHAT.userId,
                raw : {
                    name : rawFile.name,
                    size : rawFile.size,
                    type : rawFile.type,
                    source : null  // base64 string vagy üres
                },
                store : store,
                type : '',
                time : Date.now(),
                room : HD.DOM(box).data('room'),
                name : `${Date.now()}-${HD.Math.rand(100, 999)}.${rawFile.name.split('.').pop()}`,
                deleted : false
            };
            const errors = CHAT.FileTransfer.fileCheck(fileData, CHAT.Config.fileTransfer);

            if (errors.length === 0){
                const reader = new FileReader();
                (new Promise(function(resolve){
                    CHAT.Components.Transfer.progress(box, 'show');
                    reader.onload = resolve;
                })).then(function(){
                    CHAT.Components.Transfer.progress(box, 'hide');
                    CHAT.Components.Box.scrollToBottom(box);
                    return CHAT.FileTransfer.action('clientSend', [box, fileData, reader, rawFile, function(){
                        CHAT.Components.Box.scrollToBottom(box);
                    }], rawFile);
                }).catch(function(error){
                    HD.Log.error(error);
                });
                reader.readAsDataURL(rawFile);
            }
            else {
                CHAT.Components.Notification.error(errors, box);
            }
        };

        files.forEach(function(rawFile){
            filePrepare(rawFile);
        });
    },

    /**
     * Fájlküldés megszakítása
     * @param {HTMLElement} progressbar
     */
    abortFile : function(progressbar){
        const barId = HD.DOM(progressbar).dataNum('id');

        if (HD.Misc.defined(CHAT.FileTransfer.XHR[barId])){
            CHAT.FileTransfer.XHR[barId].abort();
        }
    },

    /**
     * Gépelés
     * @param {HTMLElement} box
     */
    typeMessage : function(box){
        const Box = HD.DOM(box);
        const Message = Box.descendants(CHAT.DOM.textarea);
        const data = {
            userId : CHAT.userId,
            room : Box.data('room'),
            message : Message.elem().value,
            time : Date.now()
        };

        CHAT.socket.emit('typeMessage', data);
    },

    /**
     * Üzenetküldés módjának változtatása
     * @param {HTMLElement} change
     */
    sendMethod : function(change){
        const Change = HD.DOM(change);
        const Box = Change.ancestors(CHAT.DOM.box);

        if (Change.prop('checked')){
            Box.descendants(CHAT.DOM.sendButton).class('add', 'hidden');
        }
        else {
            Box.descendants(CHAT.DOM.sendButton).class('remove', 'hidden');
        }
    }

};
