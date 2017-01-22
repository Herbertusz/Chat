/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Értesítések kezelése
 * @type {Object}
 */
CHAT.Components.Notification = {

    /**
     * Értesítés (inaktív ablak)
     * @type {Object}
     */
    status : false,

    /**
     * Hibaüzenetek jelzése
     * @param {HTMLElement} box
     * @param {Array} errors
     */
    error : function(box, errors){
        const Box = HD.DOM(box);
        const errorMessages = [];

        errors.forEach(function(error){
            errorMessages.push(CHAT.Labels.error[error.type](error.value, error.restrict));
        });
        Box.find(CHAT.DOM.errorList).elem().innerHTML = errorMessages.join('<br />');
        Box.find(CHAT.DOM.error).class('remove', 'hidden');
        setTimeout(function(){
            Box.find(CHAT.DOM.error).class('add', 'hidden');
            Box.find(CHAT.DOM.errorList).elem().innerHTML = '';
        }, CHAT.Config.error.messageWait);
    },

    /**
     * Gépelés jelzése
     * @param {HTMLElement} box
     * @param {Number} userId
     */
    stillWrite : function(box, userId){
        const userName = CHAT.Components.User.getName(userId);
        HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stillWrite(userName);
    },

    /**
     * Gépelés megállásának jelzése
     * @param {HTMLElement} box
     * @param {Number} userId
     * @param {String} message
     */
    stopWrite : function(box, userId, message){
        const userName = CHAT.Components.User.getName(userId);

        if (message.trim().length > 0){
            HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stopWrite(userName);
        }
        else {
            HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = '';
        }
        window.clearInterval(CHAT.Components.Timer.writing.timerID);
        CHAT.Components.Timer.writing.timerID = null;
    },

    /**
     * Értesítések jelzése
     * @param {HTMLElement|Boolean} [box]
     * @param {Object} [data={}]
     * @description
     * data = {
     *     type : String,   // 'message'|'file'|'create'|'join'|'leave'|
     *                      // 'forceJoinYou'|'forceJoinOther'|'forceLeaveYou'|'forceLeaveOther'
     *     fromId : Number,
     *     toId : Number,
     *     local : Boolean
     * }
     */
    trigger : function(box, data = {}){
        const notif = CHAT.Config.notification;
        const fromUserName = CHAT.Components.User.getName(data.fromId);
        const toUserName = CHAT.Components.User.getName(data.toId);
        const visualEffects = {
            title : function(activate){
                let newTitle;
                if (activate){
                    newTitle = CHAT.Labels.notification[data.type](fromUserName, toUserName);
                }
                else {
                    newTitle = CHAT.Config.defaultTitle;
                }
                window.document.title = newTitle;
                window.parent.document.title = newTitle;
            },
            box : function(activate){
                if (activate){
                    HD.DOM(box).class('add', 'notification'); // css({'outline' : '2px dashed red'});
                }
                else {
                    HD.DOM(CHAT.DOM.box).class('remove', 'notification'); // css({'outline' : '0px solid transparent'});
                }
            }
        };

        if (notif.allowed && CHAT.Components.Notification.status){
            if (notif.visual.allowed){
                notif.visual.types.forEach(function(type){
                    visualEffects[type](true);
                });
            }
            if (notif.sound.allowed){
                let audio = HD.DOM('#notification-audio').elem();
                if (!audio){
                    audio = document.createElement('audio');
                    audio.oncanplaythrough = function(){
                        audio.play();
                    };
                    audio.volume = 0.5;
                    audio.preload = 'auto';
                    audio.style.display = 'none';
                    audio.src = notif.sound.audio[data.type];
                    document.body.appendChild(audio);
                }
                else {
                    audio.play();
                }
            }
        }
        else if (notif.allowed){
            // vizuális effektek megszüntetése
            if (notif.visual.allowed){
                notif.visual.types.forEach(function(type){
                    visualEffects[type](false);
                });
            }
        }

        if (data.local && notif.local.allowed){
            // helyi értesítés
            const Box = HD.DOM(box);
            const list = Box.find(CHAT.DOM.list).elem();

            if (list.scrollHeight - list.offsetHeight - list.scrollTop < notif.local.scroll){
                list.scrollTop = list.scrollHeight;
            }
            else {
                const LocalNotification = Box.find(CHAT.DOM.localNotification);
                const tpl = `
                    ${CHAT.Labels.localNotification[data.type](fromUserName, toUserName)}
                `;

                LocalNotification.find(CHAT.DOM.text).elem().innerHTML = tpl;
                LocalNotification.class('remove', 'hidden');

                LocalNotification.event('click', function(){
                    list.scrollTop = list.scrollHeight;
                    HD.DOM(this).class('add', 'hidden');
                    HD.DOM(this).find(CHAT.DOM.text).elem().innerHTML = '';
                });
            }
        }
    }

};
