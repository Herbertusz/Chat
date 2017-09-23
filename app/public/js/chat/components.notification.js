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
     * @type {Boolean}
     */
    status : false,

    /**
     * Értesítések eseménykezelése
     */
    init : function(){
        // Értesítések állapotának beállítása
        HD.DOM('body')
            .event('mouseenter', function(){
                CHAT.Components.Notification.status = false;
                CHAT.Components.Notification.trigger();
            })
            .event('mouseleave', function(){
                CHAT.Components.Notification.status = true;
            });

        // Helyi értesítés eltüntetése
        CHAT.DOM.inBox(CHAT.DOM.list).event('scroll', function(target){
            if (target.scrollHeight - target.offsetHeight - target.scrollTop < CHAT.Config.notification.local.scroll){
                HD.DOM(target).neighbours(CHAT.DOM.box, CHAT.DOM.localNotification).class('add', 'hidden');
            }
        });
        // Hibaüzenet eltüntetése
        HD.DOM(CHAT.DOM.globalError.close).event('click', function(target){
            HD.DOM(target)
                .ancestors(CHAT.DOM.outerContainer)
                .descendants(CHAT.DOM.globalError.container)
                .class('add', 'hidden');
        });
        CHAT.DOM.inBox(CHAT.DOM.boxError.close).event('click', function(target){
            HD.DOM(target).neighbours(CHAT.DOM.box, CHAT.DOM.boxError.container).class('add', 'hidden');
        });
    },

    /**
     * Hibaüzenetek jelzése
     * @param {Array} errors
     * @param {HTMLElement} [box=null] - ha null, a hibaüzenet globális, egyébként csatornához tartozik
     */
    error : function(errors, box = null){
        const Box = box ? HD.DOM(box) : HD.DOM(CHAT.DOM.outerContainer);
        const display = box ? CHAT.DOM.boxError : CHAT.DOM.globalError;
        const errorMessages = [];

        errors.forEach(function(error){
            errorMessages.push(CHAT.Labels.error[error.type](error.value, error.restrict));
        });
        Box.descendants(display.list).elem().innerHTML = errorMessages.join('<br />');
        Box.descendants(display.container).class('remove', 'hidden');
        if (CHAT.Config.box.error.messageWait){
            setTimeout(function(){
                Box.descendants(display.container).class('add', 'hidden');
                Box.descendants(display.list).elem().innerHTML = '';
            }, CHAT.Config.box.error.messageWait);
        }
    },

    /**
     * Gépelés jelzése
     * @param {HTMLElement} box
     * @param {Number} userId
     */
    stillWrite : function(box, userId){
        if (CHAT.Config.notification.allowed && CHAT.Config.notification.writing.allowed){
            const userName = CHAT.Components.User.getName(userId);
            HD.DOM(box).descendants(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stillWrite(userName);
        }
    },

    /**
     * Gépelés megállásának jelzése
     * @param {HTMLElement} box
     * @param {Number} userId
     * @param {String} message
     */
    stopWrite : function(box, userId, message){
        if (CHAT.Config.notification.allowed && CHAT.Config.notification.writing.allowed){
            const userName = CHAT.Components.User.getName(userId);

            if (message.trim().length > 0){
                HD.DOM(box).descendants(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stopWrite(userName);
            }
            else {
                HD.DOM(box).descendants(CHAT.DOM.indicator).elem().innerHTML = '';
            }
            clearInterval(CHAT.Components.Timer.writing.timerID);
            CHAT.Components.Timer.writing.timerID = null;
        }
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
        const conf = CHAT.Config.notification;
        const fromUserName = CHAT.Components.User.getName(data.fromId);
        const toUserName = CHAT.Components.User.getName(data.toId);
        const visualEffects = {
            title : function(activate){
                let newTitle;
                if (activate){
                    newTitle = CHAT.Labels.notification.general[data.type](fromUserName, toUserName);
                }
                else {
                    newTitle = CHAT.Config.defaultTitle;
                }
                window.document.title = newTitle;
                window.parent.document.title = newTitle;
            },
            box : function(activate){
                if (activate){
                    HD.DOM(box).class('add', 'notification');
                }
                else {
                    HD.DOM(CHAT.DOM.box).class('remove', 'notification');
                }
            }
        };

        if (conf.allowed && CHAT.Components.Notification.status){
            if (conf.visual.allowed){
                // vizuális értesítés
                conf.visual.types.forEach(function(type){
                    visualEffects[type](true);
                });
            }
            if (conf.sound.allowed){
                // hangos értesítés
                let audio = HD.DOM('#notification-audio').elem();
                if (!audio){
                    audio = document.createElement('audio');
                    audio.oncanplaythrough = function(){
                        audio.play();
                    };
                    audio.volume = 0.5;
                    audio.preload = 'auto';
                    audio.style.display = 'none';
                    audio.src = conf.sound.audio[data.type];
                    document.body.appendChild(audio);
                }
                else {
                    audio.play();
                }
            }
            if (conf.desktop.allowed && 'Notification' in window){
                // asztali értesítés
                const desktopOptions = Object.assign(conf.desktop.options, CHAT.Labels.notification.desktop.options);
                let desktopNotif;
                if (Notification.permission === 'granted'){
                    desktopNotif = new Notification(
                        CHAT.Labels.notification.desktop[data.type](fromUserName, toUserName),
                        desktopOptions
                    );
                }
                else if (Notification.permission !== 'denied'){
                    Notification.requestPermission(function(permission){
                        if (permission === 'granted'){
                            desktopNotif = new Notification(
                                CHAT.Labels.notification.desktop[data.type](fromUserName, toUserName),
                                desktopOptions
                            );
                        }
                    });
                }
                if (desktopNotif && conf.desktop.closeTime){
                    setTimeout(desktopNotif.close.bind(desktopNotif), conf.desktop.closeTime);
                }
            }
        }
        else if (conf.allowed){
            // vizuális effektek megszüntetése
            if (conf.visual.allowed){
                conf.visual.types.forEach(function(type){
                    visualEffects[type](false);
                });
            }
        }

        if (data.local && conf.local.allowed){
            // helyi értesítés
            const Box = HD.DOM(box);
            const list = Box.descendants(CHAT.DOM.list).elem();

            if (list.scrollHeight - list.offsetHeight - list.scrollTop < conf.local.scroll){
                list.scrollTop = list.scrollHeight;
            }
            else {
                const LocalNotification = Box.descendants(CHAT.DOM.localNotification);
                const tpl = `
                    ${CHAT.Labels.notification.local[data.type](fromUserName, toUserName)}
                `;

                LocalNotification.descendants(CHAT.DOM.text).elem().innerHTML = tpl;
                LocalNotification.class('remove', 'hidden');

                LocalNotification.event('click', function(target){
                    const Target = HD.DOM(target);
                    list.scrollTop = list.scrollHeight;
                    Target.class('add', 'hidden');
                    Target.descendants(CHAT.DOM.text).elem().innerHTML = '';
                });
            }
        }
    }

};
