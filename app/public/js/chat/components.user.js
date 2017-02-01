/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Felhasználók kezelése
 * @type {Object}
 */
CHAT.Components.User = {

    /**
     * Felhasználónév id alapján
     * @param {Number} userId
     * @returns {String}
     */
    getName : function(userId){
        if (!userId) return '';
        const Element = HD.DOM(CHAT.DOM.onlineListItems).filter(`[data-id="${userId}"]`);
        return Element.data('name');
    },

    /**
     * Doboz tetején lévő felhasználólista létrehozása
     * @param {HTMLElement} to
     * @param {Array} userIds
     * @param {Boolean} [regenerate=false]
     */
    generateList : function(to, userIds, regenerate = false){
        if (regenerate){
            HD.DOM(to.children).filter(':not(.cloneable)').remove();
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            let user;
            const currentUserId = HD.DOM(onlineListItem).dataNum('id');
            if (userIds.indexOf(currentUserId) > -1){
                user = CHAT.DOM.cloneElement(HD.DOM(to).find('.cloneable').elem(), to, currentUserId === CHAT.userId);
                const User = HD.DOM(user);
                User.dataNum('id', currentUserId);
                User.find(CHAT.DOM.status).class('add', 'run');
                CHAT.Components.User.setStatus(user, CHAT.Components.User.getStatus(onlineListItem));
                User.find('.name').elem().innerHTML = CHAT.Components.User.getName(currentUserId);
            }
        });
    },

    /**
     * Státuszjelző DOM-elem módosítása
     * @param {HTMLElement} elem
     * @param {String} status
     */
    setStatus : function(elem, status){
        let n;
        const StatusElem = HD.DOM(elem).find(CHAT.DOM.status);
        const statuses = ['on', 'busy', 'inv', 'off'];
        const prevStatus = CHAT.Components.User.getStatus(elem);

        if (status === 'idle'){
            StatusElem.class('add', 'idle');
        }
        else {
            StatusElem.class('remove', 'idle');
            for (n = 0; n < statuses.length; n++){
                StatusElem.class('remove', statuses[n]);
            }
            StatusElem.class('add', status);
        }
        StatusElem.find('use').elem().setAttribute('xlink:href', `#${status}`);
        CHAT.Components.User.setTimer(elem, prevStatus, status);
    },

    /**
     * Státuszjelző DOM-elem lekérdezése
     * @param {HTMLElement} elem
     * @returns {String}
     */
    getStatus : function(elem){
        let n, status;
        const statusElem = HD.DOM(elem).find(CHAT.DOM.status).elem();
        const statuses = ['on', 'busy', 'inv', 'off'];

        if (statusElem.classList.contains('idle')){
            status = 'idle';
        }
        else {
            for (n = 0; n < statuses.length; n++){
                if (statusElem.classList.contains(statuses[n])){
                    status = statuses[n];
                    break;
                }
            }
        }
        return status;
    },

    /**
     * Státuszok frissítése
     * @param {Object} connectedUsers
     * @description
     * connectedUsers = {
     *     <socket.id> : {
     *         id : Number,      // user azonosító
     *         name : String,    // user login név
     *         status : String,  // user státusz ('on'|'busy'|'off')
     *         isIdle : Boolean  // user státusz: 'idle'
     *     },
     *     ...
     * }
     */
    updateStatuses : function(connectedUsers){
        const onlineUserStatuses = {};
        let socketId, isIdle;

        for (socketId in connectedUsers){
            isIdle = connectedUsers[socketId].isIdle;
            onlineUserStatuses[connectedUsers[socketId].id] = isIdle ? 'idle' : connectedUsers[socketId].status;
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            const currentId = HD.DOM(onlineListItem).dataNum('id');
            if (HD.Misc.defined(onlineUserStatuses[currentId])){
                CHAT.Components.User.setStatus(onlineListItem, onlineUserStatuses[currentId]);
            }
            else {
                CHAT.Components.User.setStatus(onlineListItem, 'off');
            }
        });
        HD.DOM(CHAT.DOM.box).elements.forEach(function(box){
            HD.DOM(box).find(CHAT.DOM.userItems).elements.forEach(function(userItem){
                const onlineStatus = onlineUserStatuses[HD.DOM(userItem).dataNum('id')];
                CHAT.Components.User.setStatus(userItem, onlineStatus || 'off');
            });
        });
    },

    /**
     * Felhasználó státuszának megváltoztatása
     * @param {String} newStatus
     * @returns {Object}
     * @description
     * return = {
     *     <socket.id> : {
     *         id : Number,      // user azonosító
     *         name : String,    // user login név
     *         status : String,  // user státusz ('on'|'busy'|'inv'|'off')
     *         isIdle : Boolean  // user státusz: 'idle'
     *     },
     *     ...
     * }
     */
    changeStatus : function(newStatus){
        let socketId;
        let thisSocket = null;
        const connectedUsers = HD.DOM(CHAT.DOM.online).dataObj('connected-users');

        for (socketId in connectedUsers){
            if (connectedUsers[socketId].id === CHAT.userId){
                thisSocket = socketId;
            }
        }
        if (thisSocket){
            if (newStatus === 'idle'){
                connectedUsers[thisSocket].isIdle = true;
            }
            else if (newStatus === 'notidle'){
                connectedUsers[thisSocket].isIdle = false;
            }
            else {
                connectedUsers[thisSocket].isIdle = false;
                connectedUsers[thisSocket].status = newStatus;
            }
        }
        HD.DOM(CHAT.DOM.online).dataObj('connected-users', connectedUsers);
        CHAT.Components.User.updateStatuses(connectedUsers);
        return connectedUsers;
    },

//    /**
//     * Inaktivitás kezdete óta eltelt idő kijelzése
//     * @param {HTMLElement} elem
//     * @param {String} prevStatus - user előző státusza ('on'|'busy'|'idle'|'inv'|'off')
//     * @param {String} nextStatus - user új státusza ('on'|'busy'|'idle'|'inv'|'off')
//     */
//    setTimer : function(elem, prevStatus, nextStatus){
//        const activeStatuses = ['on', 'busy'];
//        const inactiveStatuses = ['idle', 'inv', 'off'];
//
//
//        const userId = Number(HD.DOM(elem).data('id'));
//        const timerId = `user-${userId}`;
//        const display = HD.DOM(elem).find(CHAT.DOM.idleTimer).elem();
//
//        if (userId === 2) console.log(prevStatus, nextStatus);
//        if (CHAT.Config.idle.timeCounter && display){
//            HD.DOM.ajax({
//                method : 'POST',
//                url : '/chat/getstatus',
//                data : `userId=${userId}`
//            }).then(function(resp){
//                const lastChange = JSON.parse(resp).status;
//
//                ;
//            }).catch(function(error){
//                HD.Log.error(error);
//            });
//        }
//    },

    /**
     * Inaktivitás kezdete óta eltelt idő kijelzése
     * A CHAT.Components.Timer.counters objektumban tárolja az egyes felhasználókhoz kötött időket
     * @param {HTMLElement} elem
     * @param {String} prevStatus - user előző státusza ('on'|'busy'|'idle'|'inv'|'off')
     * @param {String} nextStatus - user új státusza ('on'|'busy'|'idle'|'inv'|'off')
     */
    setTimer : function(elem, prevStatus, nextStatus){
        let time = 0;
        const statuses = {
            active : ['on', 'busy'],
            inactive : ['idle', 'inv', 'off']
        };
        const userId = Number(HD.DOM(elem).data('id'));
        const timerId = `user-${userId}`;
        const display = HD.DOM(elem).find(CHAT.DOM.idleTimer).elem();

        if (CHAT.Config.idle.timeCounter && display){
            // A db-ben tárolt utolsó átmenet lekérdezése
            HD.DOM.ajax({
                method : 'POST',
                url : '/chat/getstatus',
                data : `userId=${userId}`
            }).then(function(resp){
                const lastChange = JSON.parse(resp).status;

                // A user offline, és még sose lépett be
                if (lastChange.prevStatus === null && lastChange.nextStatus === null && nextStatus === 'off'){
                    return;
                }

                // Ha nem fut időmérő, és * -> inaktív az átmenet, akkor a db-ben tárolt átmenetet vesszük alapul
                if (
                    lastChange.prevStatus !== null &&
                    statuses.inactive.indexOf(nextStatus) > -1 &&
                    (
                        !HD.Misc.defined(CHAT.Components.Timer.counters[timerId]) ||
                        !CHAT.Components.Timer.counters[timerId].running()
                    )
                ){
                    prevStatus = lastChange.prevStatus;
                    nextStatus = lastChange.nextStatus;
                    time = Date.now() - lastChange.created;
                }

                // Időmérő létrehozása a user-hez
                if (!HD.Misc.defined(CHAT.Components.Timer.counters[timerId])){
                    CHAT.Components.Timer.counters[timerId] = new HD.DateTime.Timer(1);
                }

                // Változott a státusz
                if (prevStatus !== nextStatus){
                    if (statuses.active.indexOf(prevStatus) > -1 && statuses.inactive.indexOf(nextStatus) > -1){
                        // Aktív -> inaktív átmenet => időmérő indítása
                        if (nextStatus === 'idle'){
                            time += CHAT.Config.idle.time;
                        }
                        CHAT.Components.Timer.counters[timerId]
                            .stop()
                            .set(Math.round(time / 1000))
                            .start(function(){
                                display.innerHTML = CHAT.Components.User.timerDisplay(this.get('D:h:m:s'));
                                // display.innerHTML = this.get('D nap, hh:mm:ss'); // debug mód
                            });
                    }
                    else if (statuses.inactive.indexOf(prevStatus) > -1 && statuses.active.indexOf(nextStatus) > -1){
                        // Inaktív -> aktív átmenet => időmérő leállítása
                        CHAT.Components.Timer.counters[timerId].stop();
                        display.innerHTML = '';
                    }
                }
            }).catch(function(error){
                HD.Log.error(error);
            });
        }
    },

    /**
     * Eltelt idő kijelzése a legnagyobb nem nulla egység szerint
     * @param {String} segmentString
     * @param {Number} [min=3] - Minimális kijelzendő időegység beállítása (1 perc)
     * @returns {String}
     */
    timerDisplay : function(segmentString, min = 3){
        let format = '';
        const segments = segmentString.split(':');
        for (let i = 0; i < segments.length && i < min; i++){
            if (segments[i] !== '0'){
                format = `${segments[i]} ${CHAT.Labels.time.idleTimer[i]}`;
                break;
            }
        }
        return format;
    }

};
