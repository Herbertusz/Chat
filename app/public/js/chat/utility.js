/* global HD, SERVER, io, LZMA */

"use strict";

var CHAT = window.CHAT || {};

/**
 * Az aktuális kliensoldali user adatai
 * @type Object
 */
CHAT.USER = {
    id : SERVER.userData.id,
    name : SERVER.userData.name
};

/**
 * Socket objektum
 * @type Object
 */
CHAT.socket = io.connect(`http://${SERVER.domain}:${SERVER.wsport}/chat`);

/**
 * Tömörítés
 * @type {Object}
 */
CHAT.lzma = LZMA;

/**
 * jQuery szelektorok
 * @type Object
 */
CHAT.DOM = {
    idleCheck : 'body',
    start : '.online .start',
    online : '.online',
    onlineListItems : '.online li',
    onlineSelfListItem : '.online li.self',
    selfStatus : '.self .status',
    statusChange : '.status-change',
    userSelect : '.user-select',
    selectedUsers : '.user-select:checked',
    container : '.chatcontainer',
    cloneBox : '.chat.cloneable',
    box : '.chat',
    userItems : '.user-item',
    userThrow : '.throw',
    users : '.users',
    close : '.close',
    addUser : '.add-user',
    list : '.list',
    message : '.message',
    file : '.fileuploader .file',
    fileTrigger : '.fileuploader .trigger',
    dropFile : '.drop-file',
    indicator : '.indicator',
    sendButton : '.send',
    sendSwitch : '.send-switch',
    error : '.error',
    errorList : '.error .error-list',
    errorClose : '.error .error-close',
    progress : '.progress'
};

/**
 * Időméréshez használt változók
 * @type Object
 */
CHAT.timer = {
    writing : {
        timerID : 0,
        interval : 1000,
        event : false,
        message : ''
    },
    drag : {
        timerID : 0,
        interval : 1000
    },
    drop : {
        timerID : 0,
        interval : 1000
    },
    idle : 300000
};

/**
 * Segédfüggvények
 * @type Object
 */
CHAT.Util = {

    /**
     * HTML entitások cseréje
     * @param {String} string
     * @returns {String}
     */
    escapeHtml : function(string){
        const entityMap = {
            "&" : "&amp;",
            "<" : "&lt;",
            ">" : "&gt;"
        };
        let str;

        str = String(string).replace(/[&<>]/g, function(s){
            return entityMap[s];
        });
        str = str.replace(/\n/g, '<br />');
        return str;
    },

    /**
     * Doboz scrollozása az aljára
     * @param {jQuery} $box doboz
     */
    scrollToBottom : function($box){
        let height = 0;
        const $list = $box.find(CHAT.DOM.list);

        $list.find('li').each(function(){
            height += $(this).outerHeight();
        });
        $list.scrollTop(height);
    },

    /**
     * Elem rekurzív másolása eseménykezelőkkel együtt
     * @param {jQuery} $element másolandó elem
     * @param {jQuery} $insert beszúrás helye
     * @param {Boolean} [prepend=false] ha true, beszúrás az elejére
     * @returns {jQuery} az elem másolata
     */
    cloneElement : function($element, $insert, prepend){
        const $clone = $element.clone(true, true);

        prepend = HD.Function.param(prepend, false);
        if (prepend){
            $clone.prependTo($insert);
        }
        else {
            $clone.appendTo($insert);
        }
        $clone.removeClass("cloneable");
        return $clone;
    }

};
