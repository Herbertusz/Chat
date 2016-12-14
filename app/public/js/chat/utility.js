/* global HD SERVER io */

'use strict';

var CHAT = window.CHAT || {};

/**
 * Az aktuális kliensoldali user adatai
 * @type {Object}
 */
CHAT.userId = SERVER.userId;

/**
 * Socket objektum
 * @type {Object}
 */
CHAT.socket = io.connect(`http://${SERVER.domain}:${SERVER.wsport}/chat`);

/**
 * Értesítés (inaktív ablak)
 * @type {Object}
 */
CHAT.notificationStatus = false;

/**
 * Szelektorok
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
    text : '.text'
};

/**
 * Időméréshez használt változók
 * @type {Object}
 */
CHAT.timer = {
    writing : {
        timerID : 0,
        interval : 1000,
        event : false,
        message : ''
    },
    idle : CHAT.Config.idle.time
};

/**
 * Segédfüggvények
 * @type {Object}
 */
CHAT.Util = {

    /**
     * HTML entitások cseréje
     * @param {String} string
     * @returns {String}
     */
    escapeHtml : function(string){
        const entityMap = {
            '&' : '&amp;',
            '<' : '&lt;',
            '>' : '&gt;'
        };
        let str;

        str = String(string).replace(/[&<>]/g, function(s){
            return entityMap[s];
        });
        str = str.replace(/\n/g, '<br />');
        return str;
    },

    /**
     * Chat-dobozon belüli elemek
     * @param {String} selector
     * @returns {HD.DOM}
     */
    inBox : function(selector){
        return HD.DOM(CHAT.DOM.box).find(selector);
    },

    /**
     * Doboz scrollozása az aljára
     * @param {HTMLElement} box - Chat-doboz
     * @param {Boolean} [conditional=false]
     */
    scrollToBottom : function(box, conditional){
        conditional = HD.Function.param(conditional, false);
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
     * Elem rekurzív másolása eseménykezelőkkel együtt
     * @param {HTMLElement} element - másolandó elem
     * @param {HTMLElement} insert - beszúrás helye
     * @param {Boolean} [prepend=false] - ha true, beszúrás az elejére
     * @returns {HTMLElement} az elem másolata
     */
    cloneElement : function(element, insert, prepend){
        prepend = HD.Function.param(prepend, false);
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
