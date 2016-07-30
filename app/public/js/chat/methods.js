/* global HD */

"use strict";

var CHAT = window.CHAT || {};

/**
 * Rendszer által kiírt szövegek
 * @type {Object}
 */
CHAT.Labels = {
    // Rendszerüzenetek
    'system' : {
        'join' : (fromUserName) =>
            `${fromUserName} csatlakozott`,
        'leave' : (fromUserName) =>
            `${fromUserName} kilépett`,
        'forceJoinYou' : (fromUserName) =>
            `${fromUserName} hozzáadott ehhez a csatornához`,
        'forceJoinOther' : (fromUserName, toUserName) =>
            `${fromUserName} hozzáadta ${toUserName} felhasználót ehhez a csatornához`,
        'forceLeaveYou' : (fromUserName) =>
            `${fromUserName} kidobott`,
        'forceLeaveOther' : (fromUserName, toUserName) =>
            `${fromUserName} kidobta ${toUserName} felhasználót`
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
        'error' : `Hiba a fájl betöltése közben`,
        'deleted' : `A fájlküldés meg lett szakítva vagy a fájl törölve lett`
    },
    // Üzenetátvitel
    'message' : {
        'stillWrite' : (userName) => `${userName} éppen ír...`,
        'stopWrite' : (userName) => `${userName} szöveget írt be`
    },
    // Értesítések
    'notification' : {
        'message' : (fromUserName) =>
            `${fromUserName} üzenetet írt`,
        'file' : (fromUserName) =>
            `${fromUserName} fájlt küldött`,
        'create' : (fromUserName) =>
            `${fromUserName} létrehozott egy csatornát`,
        'join' : (fromUserName) =>
            `${fromUserName} csatlakozott a csatornához`,
        'leave' : (fromUserName) =>
            `${fromUserName} elhagyta a csatornát`,
        'forceJoinYou' : (fromUserName) =>
            `${fromUserName} csatlakoztatott egy csatornához`,
        'forceJoinOther' : (fromUserName, toUserName) =>
            `${fromUserName} hozzáadta ${toUserName} felhasználót egy csatornához`,
        'forceLeaveYou' : (fromUserName) =>
            `${fromUserName} kidobott egy csatornából`,
        'forceLeaveOther' : (fromUserName, toUserName) =>
            `${fromUserName} kidobta ${toUserName} felhasználót az egyik csatornából`
    },
    // Helyi értesítések
    'localNotification' : {
        'message' : (fromUserName) =>
            `${fromUserName} üzenetet írt`,
        'file' : (fromUserName) =>
            `${fromUserName} fájlt küldött`,
        'join' : (fromUserName) =>
            `${fromUserName} csatlakozott ehhez a csatornához`,
        'leave' : (fromUserName) =>
            `${fromUserName} elhagyta ezt a csatornát`,
        'forceJoinOther' : (fromUserName, toUserName) =>
            `${fromUserName} hozzáadta ${toUserName} felhasználót ehhez a csatornához`,
        'forceLeaveYou' : (fromUserName) =>
            `${fromUserName} kidobott`,
        'forceLeaveOther' : (fromUserName, toUserName) =>
            `${fromUserName} kidobta ${toUserName} felhasználót`
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
 * @type {Object}
 */
CHAT.Methods = {

    /**
     * Felhasználói üzenet beszúrása
     * @param {HTMLElement} box
     * @param {Object} data
     * @param {Boolean} [highlighted=false]
     * @description
     * data = {
     *     userId : Number,
     *     message : String,
     *     time : Number,
     *     roomName : String
     * }
     */
    appendUserMessage : function(box, data, highlighted){
        highlighted = HD.Function.param(highlighted, false);
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const userName = CHAT.Methods.getUserName(data.userId);

        List.elem().innerHTML += `
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
                <br />${CHAT.Methods.replaceMessage(data.message)}
            </li>
        `;
    },

    /**
     * Rendszerüzenet beszúrása
     * @param {HTMLElement} box
     * @param {String} type - "join"|"leave"|"forceJoinYou"|"forceJoinOther"|"forceLeaveYou"|"forceLeaveOther"
     * @param {Number} fromId
     * @param {Number} [toId]
     */
    appendSystemMessage : function(box, type, fromId, toId){
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const fromUserName = CHAT.Methods.getUserName(fromId);
        const toUserName = CHAT.Methods.getUserName(toId);

        List.elem().innerHTML += `
            <li class="highlighted">${CHAT.Labels.system[type](fromUserName, toUserName)}</li>
        `;
    },

    /**
     * Fájl beszúrása
     * @param {HTMLElement} box
     * @param {Object} data
     * @param {Boolean} [highlighted=false]
     * @returns {Promise}
     * @description
     * data = {
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
     *     roomName : String,
     *     fileName : String
     * }
     */
    appendFile : function(box, data, highlighted){
        highlighted = HD.Function.param(highlighted, false);
        let tpl, imgSrc;
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const userName = CHAT.Methods.getUserName(data.userId);

        const ListItem = HD.DOM(`
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
                <br />
                <div class="filedisplay"></div>
            </li>
        `);
        const tplError = `
            <a href="${data.file}" target="_blank">${CHAT.Labels.file.error}</a>
        `;
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
        const promise = (new Promise(function(resolve, reject){
            img.onload = resolve;
            img.onerror = reject;
        })).then(function(){
            ListItem.find('.filedisplay').elem().innerHTML = tpl;
            List.elem().appendChild(ListItem.elem());
        }).catch(function(error){
            HD.Log.error(error);
            ListItem.find('.filedisplay').elem().innerHTML = tplError;
            List.elem().appendChild(ListItem.elem());
        });
        img.src = imgSrc;

        return promise;
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
        percent = Math.round(percent * 100);
        cancelable = HD.Function.param(cancelable, true);
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const tpl = `
            <li>
                <div class="progressbar" data-id="{BARID}">
                    <span class="label">${CHAT.Labels.file[direction]()}</span>
                    <span class="cancel" title="${CHAT.Labels.file.cancel()}"></span>
                    <span title="${CHAT.Labels.file.cancel()}">
                        <svg class="cancel"><use xlink:href="#cross"></use></svg>
                    </span>
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
            CHAT.Util.scrollToBottom(box, true);
            if (cancelable){
                List.find('.cancel').event("click", function(){
                    const Progressbar = HD.DOM(this).ancestor('.progressbar');
                    CHAT.Events.Client.abortFile(Progressbar.elem());
                    HD.DOM(this).class("add", "hidden");
                });
            }
            else {
                List.find('.cancel').class("add", "hidden");
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
                    Progressbar.find('.cancel').class("add", "hidden");
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
            ${CHAT.Labels.file.read()}
        `;

        if (operation === "show"){
            Progress.find(CHAT.DOM.progressText).elem().innerHTML = tpl;
            Progress.class("remove", "hidden");
        }
        else {
            Progress.class("add", "hidden");
            Progress.find(CHAT.DOM.progressText).elem().innerHTML = '';
        }
    },

    /**
     * Értesítések megjelenítése
     * @param {HTMLElement|Boolean} [box]
     * @param {Object} [data]
     * @description
     * data = {
     *     type : String,   // "message"|"file"|"create"|"join"|"leave"|
     *                      // "forceJoinYou"|"forceJoinOther"|"forceLeaveYou"|"forceLeaveOther"
     *     fromId : Number,
     *     toId : Number,
     *     local : Boolean
     * }
     */
    notification : function(box, data){
        data = HD.Function.param(data, {});
        const notif = CHAT.Config.notification;
        const fromUserName = CHAT.Methods.getUserName(data.fromId);
        const toUserName = CHAT.Methods.getUserName(data.toId);
        const visualEffects = {
            title : function(activate){
                if (activate){
                    document.title = CHAT.Labels.notification[data.type](fromUserName, toUserName);
                }
                else {
                    document.title = CHAT.Config.defaultTitle;
                }
            },
            box : function(activate){
                if (activate){
                    HD.DOM(box).class("add", "notification"); // css({"outline" : "2px dashed red"});
                }
                else {
                    HD.DOM(CHAT.DOM.box).class("remove", "notification"); // css({"outline" : "0px solid transparent"});
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
                LocalNotification.class("remove", "hidden");

                LocalNotification.event("click", function(){
                    list.scrollTop = list.scrollHeight;
                    HD.DOM(this).class("add", "hidden");
                    HD.DOM(this).find(CHAT.DOM.text).elem().innerHTML = '';
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
        if (CHAT.Config.messageSend.imageReplacement.allowed){
            let image;
            const images = CHAT.Config.messageSend.imageReplacement.images;
            for (image in images){
                const escapedIcon = image.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
                messageArray[0] = messageArray[0].replace(
                    new RegExp(escapedIcon, 'g'),
                    `<img alt="${image}" src="${images[image]}" />`
                );
                if (messageArray.length > 1){
                    messageArray[2] = messageArray[2].replace(
                        new RegExp(escapedIcon, 'g'),
                        `<img alt="${image}" src="${images[image]}" />`
                    );
                }
            }
        }
        if (CHAT.Config.messageSend.stringReplacement.allowed){
            const strings = CHAT.Config.messageSend.stringReplacement.strings;
            strings.forEach(function(str){
                messageArray[0] = messageArray[0].replace(HD.String.createRegExp(str[0]), str[1]);
                if (messageArray.length > 1){
                    messageArray[2] = messageArray[2].replace(HD.String.createRegExp(str[0]), str[1]);
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
        const userName = CHAT.Methods.getUserName(userId);
        HD.DOM(box).find(CHAT.DOM.indicator).elem().innerHTML = CHAT.Labels.message.stillWrite(userName);
    },

    /**
     * Gépelés megállásának lekezelése
     * @param {HTMLElement} box
     * @param {Number} userId
     * @param {String} message
     */
    stopWrite : function(box, userId, message){
        const userName = CHAT.Methods.getUserName(userId);

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
        Box.find(CHAT.DOM.errorList).elem().innerHTML = errorMessages.join("<br />");
        Box.find(CHAT.DOM.error).class("remove", "hidden");
        window.setTimeout(function(){
            Box.find(CHAT.DOM.error).class("add", "hidden");
            Box.find(CHAT.DOM.errorList).elem().innerHTML = '';
        }, CHAT.Config.error.messageWait);
    },

    /**
     * Felhasználónév id alapján
     * @param {Number} userId
     * @returns {String}
     */
    getUserName : function(userId){
        if (!userId) return "";
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
            HD.DOM(to.children).filter(':not(.cloneable)').remove();
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            let user;
            const currentUserId = HD.DOM(onlineListItem).dataNum("id");
            if (userIds.indexOf(currentUserId) > -1){
                user = CHAT.Util.cloneElement(HD.DOM(to).find('.cloneable').elem(), to, currentUserId === CHAT.USER.id);
                const User = HD.DOM(user);
                User.dataNum("id", currentUserId);
                User.find(CHAT.DOM.status).class("add", "run");
                CHAT.Methods.setStatus(user, CHAT.Methods.getStatus(onlineListItem));
                User.find('.name').elem().innerHTML = CHAT.Methods.getUserName(currentUserId);
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
        StatusElem.find('use').elem().setAttribute("xlink:href", `#${status}`);
    },

    /**
     * Státuszjelző DOM-elem lekérdezése
     * @param {HTMLElement} elem
     * @returns {String}
     */
    getStatus : function(elem){
        let n, status;
        const statusElem = HD.DOM(elem).find(CHAT.DOM.status).elem();
        const statuses = ["on", "busy", "idle", "inv", "off"];

        for (n = 0; n < statuses.length; n++){
            if (statusElem.classList.contains(statuses[n])){
                status = statuses[n];
                break;
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
     *         status : String,  // user státusz ("on"|"busy"|"off")
     *         isIdle : Boolean  // user státusz: "idle"
     *     },
     *     ...
     * }
     */
    updateStatuses : function(connectedUsers){
        const onlineUserStatuses = {};
        let socketId, isIdle;

        for (socketId in connectedUsers){
            isIdle = connectedUsers[socketId].isIdle;
            onlineUserStatuses[connectedUsers[socketId].id] = isIdle ? "idle" : connectedUsers[socketId].status;
        }
        HD.DOM(CHAT.DOM.onlineListItems).elements.forEach(function(onlineListItem){
            const currentId = HD.DOM(onlineListItem).dataNum("id");
            if (typeof onlineUserStatuses[currentId] !== "undefined"){
                CHAT.Methods.setStatus(onlineListItem, onlineUserStatuses[currentId]);
            }
            else {
                CHAT.Methods.setStatus(onlineListItem, "off");
            }
        });
        HD.DOM(CHAT.DOM.box).elements.forEach(function(box){
            HD.DOM(box).find(CHAT.DOM.userItems).elements.forEach(function(userItem){
                const onlineStatus = onlineUserStatuses[HD.DOM(userItem).dataNum("id")];
                CHAT.Methods.setStatus(userItem, onlineStatus || "off");
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
     *         status : String,  // user státusz ("on"|"busy"|"off")
     *         isIdle : Boolean  // user státusz: "idle"
     *     },
     *     ...
     * }
     */
    changeUserStatus : function(newStatus){
        let socketId;
        let thisSocket = null;
        const connectedUsers = HD.DOM(CHAT.DOM.online).dataObj("connected-users");

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
        HD.DOM(CHAT.DOM.online).dataObj("connected-users", connectedUsers);
        return connectedUsers;
    },

    /**
     * Doboz aktiválása/inaktiválása
     * @param {HTMLElement} box
     * @param {String} newStatus - "enabled"|"disabled"
     */
    changeBoxStatus : function(box, newStatus){
        const Box = HD.DOM(box);
        if (newStatus === "enabled"){
            Box.find(CHAT.DOM.textarea).prop("disabled", false);
            Box.find(CHAT.DOM.userThrow).dataBool("disabled", false);
            Box.find(CHAT.DOM.fileTrigger).dataBool("disabled", false);
            Box.dataBool("disabled", false);
        }
        else if (newStatus === "disabled"){
            Box.find(CHAT.DOM.textarea).prop("disabled", true);
            Box.find(CHAT.DOM.userThrow).dataBool("disabled", true);
            Box.find(CHAT.DOM.fileTrigger).dataBool("disabled", true);
            Box.dataBool("disabled", true);
        }
    },

    /**
     * Doboz kitöltése DB-ből származó adatokkal
     * @param {HTMLElement} box
     * @param {String} roomName
     * @returns {Promise}
     */
    fillBox : function(box, roomName){

        const xhr = new XMLHttpRequest();
        const postData = `roomName=${roomName}`;

        xhr.open("POST", "/chat/getroommessages");
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = function(){
            const resp = JSON.parse(xhr.responseText);
            let sequence = Promise.resolve();
            /**
             * Ajax válasz
             * @type {Object}
             * resp = {
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
                sequence = sequence
                    .then(function(){
                        let data;
                        const timestamp = msgData.created;

                        if (typeof msgData.message !== "undefined"){
                            CHAT.Methods.appendUserMessage(box, {
                                userId : msgData.userId,
                                time : timestamp,
                                message : msgData.message,
                                roomName : roomName
                            }, msgData.userId === CHAT.USER.id);
                            return Promise.resolve();
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
                            return CHAT.FileTransfer.action('receive', [box, data, msgData]);
                        }
                    })
                    .catch(function(error){
                        HD.Log.error(error);
                    });
            });
        };
        xhr.send(postData);

    }

};
