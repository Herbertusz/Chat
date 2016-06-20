/* global HD */

"use strict";

var CHAT = window.CHAT || {};

/**
 * Rendszer által kiírt szövegek
 * @type Object
 */
CHAT.Labels = {
    // Rendszerüzenetek
    'system' : {
        'join' : (userName) =>
            `${userName} csatlakozott!`,
        'leave' : (userName) =>
            `${userName} kilépett!`,
        'forceJoinYou' : (userName) =>
            `${userName} hozzáadott ehhez a csatornához!`,
        'forceJoinOther' : (userName, otherUserName) =>
            `${userName} hozzáadta ${otherUserName} felhasználót ehhez a csatornához!`,
        'forceLeaveYou' : (userName) =>
            `${userName} kidobott!`,
        'forceLeaveOther' : (userName, otherUserName) =>
            `${userName} kidobta ${otherUserName} felhasználót!`
    },
    // Fájlátvitel
    'file' : {
        'read' : () => `Fájl beolvasása...`,
        'send' : () => `Fájlküldés...`,
        'get' : () => `Fájlfogadás...`,
        'abort' : () => `Fájlátvitel megszakítva`,
        'sendEnd' : () => `Fájlküldés befejeződött`,
        'getEnd' : () => `Fájlfogadás befejeződött`,
        'cancel' : () => `Megszakítás`,
        'percent' : (percent) => `${percent}%`,
        'deleted' : `A fájlküldés meg lett szakítva vagy a fájl törölve lett`
    },
    // Üzenetátvitel
    'message' : {
        'stillWrite' : (userName) => `${userName} éppen ír...`,
        'stopWrite' : (userName) => `${userName} szöveget írt be`
    },
    'notification' : {
        'message' : (userName) => `${userName} üzenetet írt`,
        'file' : (userName) => `${userName} fájlt küldött`,
        'forceJoin' : (userName) => `${userName} csatlakoztatott egy csatornához`,
        'forceLeave' : (userName) => `${userName} kidobott egy csatornából`
    },
    // Hibaüzenetek
    'error' : {
        'fileSize' : (size, maxSize) =>
            `Túl nagy a fájl mérete (${HD.Number.displaySize(size)}, max: ${HD.Number.displaySize(maxSize)})`,
        'fileType' : (type, allowedTypes) =>
            `Nem megfelelő a fájl típusa (${type}, megengedett typusok: ${allowedTypes.join(', ')})`
    }
};

/**
 * Alkalmazásspecifikus függvények
 * @type Object
 */
CHAT.Method = {

    /**
     * Felhasználói üzenet beszúrása
     * @param {HTMLElement} box
     * @param {Object} data
     * @param {Boolean} [highlighted=false]
     * @description data szerkezete: {
     *     userId : Number,
     *     message : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    appendUserMessage : function(box, data, highlighted){
        const time = HD.DateTime.format('H:i:s', data.time);
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const userName = CHAT.Method.getUserName(data.userId);
        highlighted = HD.Function.param(highlighted, false);

        List.elem().innerHTML += `
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
                <br />${CHAT.Method.replaceMessage(data.message)}
            </li>
        `;
        CHAT.Util.scrollToBottom(box);
    },

    /**
     * Rendszerüzenet beszúrása
     * @param {HTMLElement} box
     * @param {String} type
     * @param {Number} userId
     * @param {Number} [otherUserId]
     */
    appendSystemMessage : function(box, type, userId, otherUserId){
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const userName = CHAT.Method.getUserName(userId);
        const otherUserName = CHAT.Method.getUserName(otherUserId);

        List.elem().innerHTML += `
            <li class="highlighted">${CHAT.Labels.system[type](userName, otherUserName)}</li>
        `;

        CHAT.Util.scrollToBottom(box);
    },

    /**
     * Fájl beszúrása
     * @param {HTMLElement} box
     * @param {Object} data
     * @param {Boolean} [highlighted=false]
     * @description data szerkezete: {
     *     userId : Number,
     *     fileData : {
     *         name : String,
     *         size : Number,
     *         type : String
     *     },
     *     file : String,
     *     store : String,
     *     type : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    appendFile : function(box, data, highlighted){
        let tpl, imgSrc;
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const time = HD.DateTime.format('H:i:s', data.time);
        const userName = CHAT.Method.getUserName(data.userId);
        highlighted = HD.Function.param(highlighted, false);

        const ListItem = HD.DOM(`
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
                <br />
                <div class="filedisplay"></div>
            </li>
        `);
        if (data.type === "image"){
            imgSrc = data.file;
            tpl = `
                <a href="${data.file}" target="_blank">
                    <img class="send-image" alt="${data.fileData.name}" src="${imgSrc}" />
                </a>
            `;
        }
        else {
            imgSrc = `/images/filetypes/${data.type}.gif`;
            tpl = `
                <a href="${data.file}" target="_blank">
                    <img alt="" src="${imgSrc}" />
                    ${data.fileData.name}
                </a>
            `;
        }

        const img = document.createElement('img');
        img.onload = function(){
            ListItem.find('.filedisplay').elem().innerHTML = tpl;
            List.elem().appendChild(ListItem.elem());
            CHAT.Util.scrollToBottom(box);
        };
        img.src = imgSrc;
    },

    /**
     * Fájl beszúrása
     * @param {HTMLElement} box
     * @param {Object} data
     * @param {Boolean} [highlighted=false]
     * @description data szerkezete: {
     *     userId : Number,
     *     fileData : {
     *         name : String,
     *         size : Number,
     *         type : String
     *     },
     *     file : String,
     *     store : String,
     *     type : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    appendDeletedFile : function(box, data, highlighted){
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const time = HD.DateTime.format('H:i:s', data.time);
        const userName = CHAT.Method.getUserName(data.userId);
        highlighted = HD.Function.param(highlighted, false);

        const ListItem = HD.DOM(`
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
                <br />
                <div class="filedisplay">${CHAT.Labels.file.deleted}</div>
            </li>
        `);

        List.elem().appendChild(ListItem.elem());
        CHAT.Util.scrollToBottom(box);
    },

    /**
     * Folyamatjelzők kezelése
     * @param {HTMLElement} box
     * @param {String} direction
     * @param {Number} percent
     * @param {Number|null} barId - ha újat kell létrehozni, akkor null, egyébként egy létező progressbar id-ja
     * @param {Boolean} cancelable
     * @returns {Number|null}
     */
    progressbar : function(box, direction, percent, barId, cancelable){
        const List = HD.DOM(box).find(CHAT.DOM.list);
        percent = Math.round(percent * 100);
        cancelable = HD.Function.param(cancelable, true);
        const tpl = `
            <li>
                <div class="progressbar" data-id="{BARID}">
                    <span class="label">${CHAT.Labels.file[direction]()}</span>
                    <span class="cancel" title="${CHAT.Labels.file.cancel()}"></span>
                    <span class="linecontainer">
                        <span class="line" style="width: ${percent}%"></span>
                    </span>
                    <span class="numeric">${CHAT.Labels.file.percent(percent)}</span>
                </div>
            </li>
        `;

        if (!barId){
            barId = HD.Number.getUniqueId();
            List.elem().innerHTML += tpl.replace("{BARID}", barId.toString());
            CHAT.Util.scrollToBottom(box);
            if (cancelable){
                List.find('.cancel').event("click", function(){
                    const Progressbar = HD.DOM(this).ancestor('.progressbar');
                    CHAT.Events.Client.abortFile(Progressbar.elem());
                    HD.DOM(this).class("add", "hidden-weak");
                });
            }
            else {
                List.find('.cancel').class("add", "hidden-weak");
            }
            return barId;
        }
        else {
            const Progressbar = List.find('.progressbar').filter(`[data-id="${barId}"]`);
            if (direction === "abort"){
                Progressbar.find('.label').elem().innerHTML = CHAT.Labels.file[direction]();
                Progressbar.find('.line').class("add", "aborted");
            }
            else {
                if (percent === 100){
                    Progressbar.find('.label').elem().innerHTML = CHAT.Labels.file[`${direction}End`]();
                    Progressbar.find('.line').class("add", "finished");
                    Progressbar.find('.cancel').class("add", "hidden-weak");
                }
                Progressbar.find('.line').css({"width" : `${percent}%`});
                Progressbar.find('.numeric').elem().innerHTML = CHAT.Labels.file.percent(percent);
            }
            return null;
        }
    },

    /**
     * Indeterminisztikus folyamatjelző kezelése
     * @param {HTMLElement} box
     * @param {String} operation
     */
    progress : function(box, operation){
        const Progress = HD.DOM(box).find(CHAT.DOM.progress);
        const tpl = `
            <span class="text">${CHAT.Labels.file.read()}</span>
        `;
        if (operation === "show"){
            Progress.elem().innerHTML = tpl;
            Progress.class("remove", "hidden-weak");
        }
        else {
            Progress.class("add", "hidden-weak");
            Progress.elem().innerHTML = '';
        }
    },

    /**
     *
     * @param {HTMLElement|Boolean} [box]
     * @param {Number} [triggerId]
     * @param {String} [operation] ("message", "file", "forceJoin", "forceLeave")
     */
    notification : function(box, triggerId, operation){
        const notif = CHAT.Config.notification;
        const userName = CHAT.Method.getUserName(triggerId);
        const visualEffects = {
            title : function(activate){
                if (activate){
                    document.title = CHAT.Labels.notification[operation](userName);
                }
                else {
                    document.title = CHAT.Config.defaultTitle;
                }
            },
            box : function(activate){
                if (activate){
                    box.css({"outline" : "2px dashed red"});
                }
                else {
                    HD.DOM(CHAT.DOM.box).css({"outline" : "0px solid transparent"});
                }
            }
        };
        if (notif.allowed && CHAT.notificationStatus){
            if (notif.visual.allowed){
                notif.visual.types.forEach(function(type){
                    visualEffects[type](true);
                });
            }
            if (notif.sound.allowed){
                let audio = HD.DOM('#notification-audio').elem();
                if (!audio){
                    audio = document.createElement("audio");
                    audio.oncanplaythrough = function(){
                        audio.play();
                    };
                    audio.volume = 0.5;
                    audio.preload = "auto";
                    audio.style.display = "none";
                    audio.src = notif.sound.audio;
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
    },

    /**
     * Módosítások az elküldött szövegben
     * @param {String} message
     * @returns {String}
     */
    replaceMessage : function(message){
        const disablePattern = CHAT.Config.messageSend.replaceDisable;
        if (CHAT.Config.messageSend.escapeHTML){
            message = CHAT.Util.escapeHtml(message);
        }
        const messageArray = message.split(HD.String.createRegExp(disablePattern));
        if (CHAT.Config.messageSend.emoticonReplacement.allowed){
            let icon;
            const emoticons = CHAT.Config.messageSend.emoticonReplacement.emoticons;
            for (icon in emoticons){
                const escapedIcon = icon.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
                messageArray[0] = messageArray[0].replace(
                    new RegExp(escapedIcon, 'g'),
                    `<img alt="${icon}" src="${emoticons[icon]}" />`
                );
                if (messageArray.length > 1){
                    messageArray[2] = messageArray[2].replace(
                        new RegExp(escapedIcon, 'g'),
                        `<img alt="${icon}" src="${emoticons[icon]}" />`
                    );
                }
            }
        }
        if (CHAT.Config.messageSend.bbCodeReplacement.allowed){
            const bbCodes = CHAT.Config.messageSend.bbCodeReplacement.bbCodes;
            bbCodes.forEach(function(code){
                messageArray[0] = messageArray[0].replace(HD.String.createRegExp(code[0]), code[1]);
                if (messageArray.length > 1){
                    messageArray[2] = messageArray[2].replace(HD.String.createRegExp(code[0]), code[1]);
                }
            });
        }
        message = messageArray.join('');
        return message;
    },

    /**
     * Gépelés jelzése
     * @param {HTMLElement} box
     * @param {Number} userId
     */
    stillWrite : function(box, userId){
        const userName = CHAT.Method.getUserName(userId);
        HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stillWrite(userName);
    },

    /**
     * Gépelés megállásának lekezelése
     * @param {HTMLElement} box
     * @param {Number} userId
     * @param {String} message
     */
    stopWrite : function(box, userId, message){
        const userName = CHAT.Method.getUserName(userId);

        if (message.trim().length > 0){
            HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stopWrite(userName);
        }
        else {
            HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = '';
        }
        window.clearInterval(CHAT.timer.writing.timerID);
        CHAT.timer.writing.timerID = null;
    },

    /**
     * Hibaüzenetek kiírása
     * @param {HTMLElement} box
     * @param {Array} errors
     */
    showError : function(box, errors){
        const Box = HD.DOM(box);
        const errorMessages = [];
        errors.forEach(function(error){
            errorMessages.push(CHAT.Labels.error[error.type](error.value, error.restrict));
        });
        Box.find(CHAT.DOM.errorList).elem().innerHTML(errorMessages.join("<br />"));
        Box.find(CHAT.DOM.error).class("remove", "hidden-weak");
        window.setTimeout(function(){
            Box.find(CHAT.DOM.error).class("add", "hidden-weak");
            Box.find(CHAT.DOM.errorList).elem().innerHTML = '';
        }, CHAT.Config.error.messageWait);
    },

    /**
     * Felhasználónév id alapján
     * @param {Number} userId
     * @returns {String}
     */
    getUserName : function(userId){
        const Element = HD.DOM(CHAT.DOM.onlineListItems).filter(`[data-id="${userId}"]`);
        return Element.data("name");
    },

    /**
     * Doboz tetején lévő felhasználólista létrehozása
     * @param {HTMLElement} to
     * @param {Array} userIds
     * @param {Boolean} [regenerate=false]
     */
    generateUserList : function(to, userIds, regenerate){
        regenerate = HD.Function.param(regenerate, false);

        if (regenerate){
            HD.DOM(to.childNodes).filter(':not(.cloneable)').remove();
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            let user;
            const currentUserId = HD.DOM(onlineListItem).data("id");
            if (userIds.indexOf(currentUserId) > -1){
                user = CHAT.Util.cloneElement(HD.DOM(to).find('.cloneable').elem(), to, currentUserId === CHAT.USER.id);
                const User = HD.DOM(user);
                User.data("id", currentUserId);
                User.find('.status').class("add", CHAT.Method.getStatus(onlineListItem)).class("add", "run");
                User.find('.name').elem().innerHTML = CHAT.Method.getUserName(currentUserId);
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
        const StatusElem = HD.DOM(elem).find('.status');
        const statuses = ["on", "busy", "inv", "off"];

        if (status === "idle"){
            StatusElem.class("add", "idle");
        }
        else {
            StatusElem.class("remove", "idle");
            for (n = 0; n < statuses.length; n++){
                StatusElem.class("remove", statuses[n]);
            }
            StatusElem.class("add", status);
        }
    },

    /**
     * Státuszjelző DOM-elem lekérdezése
     * @param {HTMLElement} elem
     * @returns {String}
     */
    getStatus : function(elem){
        let n, status;
        const StatusElem = HD.DOM(elem).find('.status');
        const statuses = ["on", "busy", "idle", "inv", "off"];

        for (n = 0; n < statuses.length; n++){
            if (StatusElem.class("contains", statuses[n])){
                status = statuses[n];
                break;
            }
        }
        return status;
    },

    /**
     * Státuszok frissítése
     * @param {Object} connectedUsers
     */
    updateStatuses : function(connectedUsers){
        const onlineUserStatuses = {};
        let socketId, isIdle;

        for (socketId in connectedUsers){
            isIdle = connectedUsers[socketId].isIdle;
            onlineUserStatuses[connectedUsers[socketId].id] = isIdle ? "idle" : connectedUsers[socketId].status;
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            const currentId = HD.DOM(onlineListItem).data("id");
            if (typeof onlineUserStatuses[currentId] !== "undefined"){
                CHAT.Method.setStatus(onlineListItem, onlineUserStatuses[currentId]);
            }
            else {
                CHAT.Method.setStatus(onlineListItem, "off");
            }
        });
        HD.DOM(CHAT.DOM.box).elements.forEach(function(box){
            HD.DOM(box).find(CHAT.DOM.userItems).elements.forEach(function(userItem){
                const onlineStatus = onlineUserStatuses[HD.DOM(userItem).data("id")];
                CHAT.Method.setStatus(userItem, onlineStatus || "off");
            });
        });
    },

    /**
     * Felhasználó státuszának megváltoztatása
     * @param {String} newStatus
     * @returns {Object}
     */
    changeUserStatus : function(newStatus){
        let socketId;
        let thisSocket = null;
        const connectedUsers = HD.DOM(CHAT.DOM.online).data("connectedUsers");

        for (socketId in connectedUsers){
            if (connectedUsers[socketId].id === CHAT.USER.id){
                thisSocket = socketId;
                break;
            }
        }
        if (thisSocket){
            if (newStatus === "idle"){
                connectedUsers[thisSocket].isIdle = true;
            }
            else if (newStatus === "notidle"){
                connectedUsers[thisSocket].isIdle = false;
            }
            else {
                connectedUsers[thisSocket].isIdle = false;
                connectedUsers[thisSocket].status = newStatus;
            }
        }
        HD.DOM(CHAT.DOM.online).data("connectedUsers", connectedUsers);
        return connectedUsers;
    },

    /**
     * Doboz aktiválása/inaktiválása
     * @param {HTMLElement} box
     * @param {String} newStatus "enabled"|"disabled"
     */
    changeBoxStatus : function(box, newStatus){
        const Box = HD.DOM(box);
        if (newStatus === "enabled"){
            Box.find(CHAT.DOM.message).prop("disabled", "false");
            Box.find(CHAT.DOM.userThrow).data("disabled", "false");
            Box.find(CHAT.DOM.fileTrigger).data("disabled", "false");
            Box.data("disabled", "false");
        }
        else if (newStatus === "disabled"){
            Box.find(CHAT.DOM.message).prop("disabled", "true");
            Box.find(CHAT.DOM.userThrow).data("disabled", "true");
            Box.find(CHAT.DOM.fileTrigger).data("disabled", "true");
            Box.data("disabled", "true");
        }
    },

    /**
     * Doboz kitöltése DB-ből származó adatokkal
     * @param {HTMLElement} box
     * @param {String} roomName
     * @param {Function} [callback]
     */
    fillBox : function(box, roomName, callback){
        callback = HD.Function.param(callback, function(){});

        $.ajax({
            type : "POST",
            url : "/chat/getroommessages",
            data : {
                roomName : roomName
            },
            dataType : "json",
            success : function(resp){
                /**
                 * @description resp : {
                 *     messages : [
                 *         0 : {
                 *             _id : ObjectID,
                 *             userId : Number,
                 *             userName : String,
                 *             room : String,
                 *             message : String|undefined,
                 *             file : Object|undefined {
                 *                 name : String,
                 *                 size : Number,
                 *                 type : String,
                 *                 mainType : String,
                 *                 store : String,
                 *                 data : String,
                 *                 deleted : Boolean
                 *             },
                 *             created : String
                 *         }
                 *     ]
                 * }
                 */
                resp.messages.forEach(function(msgData){
                    let data;
                    const timestamp = Date.parse(msgData.created.replace(/ /g, 'T')) / 1000;

                    if (typeof msgData.message !== "undefined"){
                        CHAT.Method.appendUserMessage(box, {
                            userId : msgData.userId,
                            time : timestamp,
                            message : msgData.message,
                            roomName : roomName
                        }, msgData.userId === CHAT.USER.id);
                    }
                    else {
                        data = {
                            userId : msgData.userId,
                            fileData : {
                                name : msgData.file.name,
                                size : msgData.file.size,
                                type : msgData.file.type,
                                deleted : msgData.file.deleted
                            },
                            file : null,
                            type : msgData.file.mainType,
                            time : timestamp,
                            roomName : roomName
                        };
                        CHAT.FileTransfer.action('receive', [box, data, msgData]);
                    }
                });
                callback();
            }
        });
    }

};
