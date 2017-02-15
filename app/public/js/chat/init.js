/* global HD SERVER io */

'use strict';

var CHAT = window.CHAT || {};

/**
 * Az aktuális kliensoldali user azonosítója
 * @type {Object}
 */
CHAT.userId = SERVER.userId;

/**
 * Socket objektum
 * @type {Object}
 */
CHAT.socket = io.connect(`http://${SERVER.domain}:${SERVER.wsport}/chat`);

/**
 * Szelektorok és alkalmazás-specifikus DOM-műveletek
 * @type {Object}
 */
CHAT.DOM = {
    idleCheck : 'body',
    // user-sáv
    start : '.online .start',
    online : '.online',
    onlineListItems : '.online li',
    status : '.status',
    statusChange : '.status-change',
    userSelect : '.user-select',
    selectedUsers : '.user-select:checked',
    idleTimer : '.idle-timer',
    // chat-dobozok
    container : '.chat-container',
    cloneBox : '.chat.cloneable',
    box : '.chat',
    dragMove : '.move',
    dragResize : '.resize',
    userItems : '.user-item',
    userThrow : '.throw',
    users : '.users',
    close : '.close',
    addUser : '.add-user',
    list : '.list',
    textarea : '.textarea',
    file : '.fileuploader .file',
    fileTrigger : '.fileuploader .trigger',
    dropFile : '.drop-file',
    indicator : '.indicator',
    sendButton : '.send',
    sendSwitch : '.send-switch',
    error : '.error',
    errorList : '.error .error-list',
    errorClose : '.error .error-close',
    progress : '.progress',
    progressText : '.text',
    localNotification : '.local-notification',
    text : '.text',

    /**
     * Chat-dobozon belüli elemek
     * @param {String} selector - dobozon belüli szelektor
     * @returns {HD.DOM}
     */
    inBox : function(selector){
        return HD.DOM(CHAT.DOM.box).find(selector);
    },

    /**
     * Elem rekurzív másolása eseménykezelőkkel együtt és beszúrása egy másik elembe
     * @param {HTMLElement} element - másolandó elem
     * @param {HTMLElement} insert - beszúrás helye
     * @param {Boolean} [prepend=false] - ha true, beszúrás az elejére
     * @returns {HTMLElement} az elem másolata
     */
    cloneElement : function(element, insert, prepend = false){
        const Clone = HD.DOM(element).clone(true);

        if (prepend){
            insert.insertBefore(Clone.elem(), insert.firstChild);
        }
        else {
            insert.appendChild(Clone.elem());
        }
        Clone.class('remove', 'cloneable');
        return Clone.elem();
    }
};
