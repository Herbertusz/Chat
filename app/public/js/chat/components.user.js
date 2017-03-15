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
     * User-sáv görgetése
     * @deprecated nincs használva, helyette a CHAT.Components.User.openList használandó
     */
    dragList : function(){
        const userDrag = {
            active : false,
            moving : false,
            x : 0
        };

        CHAT.DOM.inBox(CHAT.DOM.users).event('mousedown', function(event){
            event.preventDefault();
            userDrag.active = true;
            userDrag.x = event.pageX;
        });
        CHAT.DOM.inBox(CHAT.DOM.users).event('mouseup mouseleave', function(event){
            event.preventDefault();
            userDrag.active = false;
            userDrag.moving = false;
        });
        CHAT.DOM.inBox(CHAT.DOM.users).event('mousemove', function(event){
            if (userDrag.active){
                if (userDrag.moving){
                    this.scrollLeft = userDrag.x - event.pageX;
                }
                else {
                    userDrag.moving = true;
                    userDrag.x = this.scrollLeft + event.pageX;
                }
            }
        });
    },

    /**
     * User-sáv lenyíló lista
     */
    openList : function(){
        CHAT.DOM.inBox(CHAT.DOM.userItems).event('click', function(){
            const Trigger = HD.DOM(this);
            if (this.classList.contains('current')){
                const List = Trigger.ancestor(CHAT.DOM.users);
                List.dataBool('active', !List.dataBool('active'));
                Trigger.find(CHAT.DOM.userDropdown).class('toggle', 'active');
                List.find(CHAT.DOM.userItems).elements.forEach(function(elem, i){
                    const Elem = HD.DOM(elem);
                    if (Elem.dataNum('id') !== CHAT.userId && !Elem.filter('.cloneable').elem()){
                        Elem.class('toggle', 'hidden');
                    }
                });
            }
        });
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
            let userElem;
            const currentUserId = HD.DOM(onlineListItem).dataNum('id');
            if (userIds.indexOf(currentUserId) > -1){
                userElem = HD.DOM(to).find('.cloneable').copyPaste(to, currentUserId === CHAT.userId);
                const UserElem = HD.DOM(userElem);
                UserElem.dataNum('id', currentUserId);
                UserElem.find(CHAT.DOM.status).class('add', 'run');
                CHAT.Components.User.setStatus(userElem, CHAT.Components.User.getStatus(onlineListItem));
                if (currentUserId === CHAT.userId){
                    // Belépett user
                    UserElem.class('add', 'current').find(CHAT.DOM.userThrow).class('add', 'hidden');
                }
                else if (!HD.DOM(to).dataBool('active')){
                    // Nincs lenyitva a lista
                    UserElem.class('add', 'hidden').find(CHAT.DOM.userDropdown).class('add', 'hidden');
                }
                else {
                    // Le van nyitva a lista
                    console.log(3);
                    UserElem.find(CHAT.DOM.userDropdown).class('add', 'hidden');
                }
                UserElem.find('.name').elem().innerHTML = CHAT.Components.User.getName(currentUserId);
            }
        });
    },

    /**
     * Státuszjelző DOM-elem módosítása
     * @param {HTMLElement} elem - CHAT.DOM.onlineListItems elem
     * @param {String} status
     */
    setStatus : function(elem, status){
        const UserElem = HD.DOM(elem);
        const userId = UserElem.dataNum('id');
        const StatusElem = UserElem.find(CHAT.DOM.status);
        const statuses = new Set([...CHAT.Config.status.online, ...CHAT.Config.status.offline]);
        const prevStatus = CHAT.Components.User.getStatus(elem);
        const statusIcon = CHAT.Components.User.getStatusIcon(CHAT.Components.User.getStatusDetails(userId));

        if (status === 'idle'){
            StatusElem.class('add', 'idle');
        }
        else {
            StatusElem.class('remove', 'idle');
            for (const st of statuses){
                StatusElem.class('remove', st);
            }
            StatusElem.class('add', status);
        }
        StatusElem.find('use').elem().setAttribute('xlink:href', `#${statusIcon}`);
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
        const statuses = new Set([...CHAT.Config.status.online, ...CHAT.Config.status.offline]);

        if (statusElem.classList.contains('idle')){
            status = 'idle';
        }
        else {
            for (const st of statuses){
                if (statusElem.classList.contains(st)){
                    status = st;
                    break;
                }
            }
        }
        return status;
    },

    /**
     *
     * @param {Number} userId
     * @returns {Object}
     * @description
     * returns = {
     *     status : String   // user státusz (CHAT.Labels.status.online + offline)
     *     isIdle : Boolean  // user tétlen státuszban van
     * }
     */
    getStatusDetails : function(userId){
        const statusObj = {
            status : CHAT.Config.status.offline[0],
            isIdle : false
        };
        const connectedUsers = HD.DOM(CHAT.DOM.online).dataObj('connected-users');

        for (const socketId in connectedUsers){
            if (connectedUsers[socketId].id === userId){
                statusObj.status = connectedUsers[socketId].status;
                statusObj.isIdle = connectedUsers[socketId].isIdle;
                break;
            }
        }
        return statusObj;
    },

    /**
     *
     * @param {Object} statusObj
     * @returns {String}
     * @description
     * statusObj = {
     *     status : String   // user státusz (CHAT.Labels.status.online + offline)
     *     isIdle : Boolean  // user tétlen státuszban van
     * }
     */
    getStatusIcon : function(statusObj){
        let statusIcon;
        if (statusObj.isIdle){
            statusIcon = CHAT.Config.status.idle.except.find((st) => st === statusObj.status);
            if (!statusIcon){
                statusIcon = 'idle';
            }
        }
        else {
            statusIcon = statusObj.status;
        }
        return statusIcon;
    },

    /**
     * Státuszok frissítése
     * @param {Object} connectedUsers
     * @description
     * connectedUsers = {
     *     <socket.id> : {
     *         id : Number,      // user azonosító
     *         name : String,    // user login név
     *         status : String,  // user státusz (CHAT.Labels.status.online + offline)
     *         isIdle : Boolean  // user tétlen státuszban van
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
                CHAT.Components.User.setStatus(onlineListItem, CHAT.Config.status.offline[0]);
            }
        });
        HD.DOM(CHAT.DOM.box).elements.forEach(function(box){
            HD.DOM(box).find(CHAT.DOM.userItems).elements.forEach(function(userItem){
                const onlineStatus = onlineUserStatuses[HD.DOM(userItem).dataNum('id')];
                CHAT.Components.User.setStatus(userItem, onlineStatus || CHAT.Config.status.offline[0]);
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
     *         status : String,  // user státusz (CHAT.Labels.status.online + offline)
     *         isIdle : Boolean  // user tétlen státuszban van
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

    /**
     * Felhasználói státuszok eseménykezelése
     */
    statusEvents : function(){
        // Státusz megváltoztatása
        HD.DOM(CHAT.DOM.online).find(CHAT.DOM.statusChange).event('change', function(){
            const connectedUsers = CHAT.Components.User.changeStatus(this.value);
            CHAT.socket.emit('statusChanged', connectedUsers, CHAT.userId);
        });

        // Tétlen állapot TODO: saját kód
        if (CHAT.Config.status.idle.allowed){
            $(CHAT.DOM.idleCheck).idleTimer(CHAT.Components.Timer.idle);
            $(CHAT.DOM.idleCheck).on('idle.idleTimer', function(){
                const connectedUsers = CHAT.Components.User.changeStatus('idle');
                CHAT.socket.emit('statusChanged', connectedUsers, CHAT.userId);
            });
            $(CHAT.DOM.idleCheck).on('active.idleTimer', function(){
                const connectedUsers = CHAT.Components.User.changeStatus('notidle');
                CHAT.socket.emit('statusChanged', connectedUsers, CHAT.userId);
            });
        }
    },

    /**
     * Inaktivitás kezdete óta eltelt idő kijelzése
     * A CHAT.Components.Timer.counters objektumban tárolja az egyes felhasználókhoz kötött időket
     * @param {HTMLElement} elem
     * @param {String} prevStatus - user előző státusza (CHAT.Labels.status.active + inactive)
     * @param {String} nextStatus - user új státusza (CHAT.Labels.status.active + inactive)
     */
    setTimer : function(elem, prevStatus, nextStatus){
        let time = 0;
        const statuses = {
            active : CHAT.Config.status.active,
            inactive : CHAT.Config.status.inactive
        };
        const userId = Number(HD.DOM(elem).data('id'));
        const timerId = `user-${userId}`;
        const display = HD.DOM(elem).find(CHAT.DOM.idleTimer).elem();

        if (CHAT.Config.status.idle.timeCounter && display){
            // A db-ben tárolt utolsó átmenet lekérdezése
            HD.DOM.ajax({
                method : 'POST',
                url : '/chat/getstatus',
                data : `userId=${userId}`
            }).then(function(resp){
                const lastChange = JSON.parse(resp).status;

                // A user offline, és még sose lépett be
                if (
                    lastChange.prevStatus === null &&
                    lastChange.nextStatus === null &&
                    nextStatus === CHAT.Config.status.offline[0]
                ){
                    display.innerHTML = CHAT.Labels.time.notYetOnline;
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
                            time += CHAT.Config.status.idle.time;
                        }
                        CHAT.Components.Timer.counters[timerId]
                            .stop()
                            .set(Math.round(time / 1000))
                            .start(function(){
                                if (this.get() < 60){
                                    display.innerHTML = CHAT.Labels.time.lessThanMin;
                                }
                                else {
                                    display.innerHTML = CHAT.Components.User.timerDisplay(this.get('D:h:m:s'));
                                }
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
