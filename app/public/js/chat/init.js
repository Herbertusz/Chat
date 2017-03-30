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
    dragResize : {
        all : '.drag-resize',
        lt  : '.drag-resize.resize-lt',
        rt  : '.drag-resize.resize-rt',
        lb  : '.drag-resize.resize-lb',
        rb  : '.drag-resize.resize-rb'
    },
    clickResize : '.click-resize',
    users : '.users',
    userItems : '.user-item',
    userThrow : '.throw',
    userDropdown : '.dropdown',
    settings : '.settings',
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
     * Látható chat-dobozon belüli elemek
     * @param {String} selector - dobozon belüli szelektor
     * @returns {HD.DOM}
     */
    inVisibleBox : function(selector){
        return HD.DOM(CHAT.DOM.box).filter(':not(.cloneable)').find(selector);
    }

};
