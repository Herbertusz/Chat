/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Szöveg- és fájlátvitelek kezelése
 * @type {Object}
 */
CHAT.Components.Transfer = {

    /**
     * Üzenetküldés eseménykezelése
     */
    initMessage : function(){
        // Üzenet gépelése
        CHAT.DOM.inBox(CHAT.DOM.textarea).event('keyup', function(event){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);

            if (event.which !== HD.Misc.keys.ENTER){
                CHAT.Events.Client.typeMessage(Box.elem());
            }
        });

        // Üzenetküldés indítása ENTER leütésére
        CHAT.DOM.inBox(CHAT.DOM.textarea).event('keydown', function(event){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);

            if (event.which === HD.Misc.keys.ENTER){
                if (!event.shiftKey && Box.find(CHAT.DOM.sendSwitch).prop('checked')){
                    CHAT.Events.Client.sendMessage(Box.elem());
                    event.preventDefault();
                }
            }
        });

        // Üzenetküldés indítása gombnyomásra
        CHAT.DOM.inBox(CHAT.DOM.sendButton).event('click', function(){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
            CHAT.Events.Client.sendMessage(Box.elem());
        });

        // Üzenetküldés módja
        CHAT.DOM.inBox(CHAT.DOM.sendSwitch).event('change', function(){
            CHAT.Events.Client.sendMethod(this);
        });
    },

    /**
     * Fájlátvitel eseménykezelése
     */
    initFile : function(){
        // Fájlküldés (hagyományos)
        CHAT.DOM.inBox(CHAT.DOM.fileTrigger).event('click', function(){
            const Trigger = HD.DOM(this);

            if (!Trigger.dataBool('disabled')){
                Trigger.ancestor(CHAT.DOM.box).find(CHAT.DOM.file).trigger('click');
            }
        });
        CHAT.DOM.inBox(CHAT.DOM.file).event('change', function(){
            const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
            const files = Box.find(CHAT.DOM.file).elem().files;

            if (files.length > 0){
                CHAT.Events.Client.sendFile(Box.elem(), files);
            }
        });

        // Fájlküldés (drag-n-drop)
        let active = false;
        let timeout;
        HD.DOM(document)
            .event('dragover', function(){
                if (typeof timeout !== 'undefined'){
                    clearTimeout(timeout);
                    if (!active){
                        active = true;
                        CHAT.DOM.inBox(CHAT.DOM.dropFile).class('add', 'drop-active');
                    }
                }
                timeout = setTimeout(function(){
                    active = false;
                    CHAT.DOM.inBox(CHAT.DOM.dropFile).class('remove', 'drop-active', 'drop-highlight');
                }, 100);
            });
        CHAT.DOM.inBox(CHAT.DOM.dropFile)
            .event(
                'drag dragstart dragend dragover dragenter dragleave drop',
                function(event){
                    event.preventDefault();
                    if (event.type !== 'dragover'){
                        event.stopPropagation();
                    }
                }
            )
            .event('dragenter', function(){
                HD.DOM(this).class('add', 'drop-active', 'drop-highlight');
            })
            .event('dragleave', function(){
                HD.DOM(this).class('remove', 'drop-highlight');
            })
            .event('dragend drop', function(){
                CHAT.DOM.inBox(CHAT.DOM.dropFile).class('remove', 'drop-active', 'drop-highlight');
            })
            .event('drop', function(event){
                const Box = HD.DOM(this).ancestor(CHAT.DOM.box);
                const files = event.dataTransfer.files;
                CHAT.Events.Client.sendFile(Box.elem(), files);
            });
    },

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
     * Módosítások az elküldött szövegben
     * @param {String} message
     * @returns {String}
     */
    replaceMessage : function(message){
        const disablePattern = CHAT.Config.messageSend.replaceDisable;
        if (CHAT.Config.messageSend.escapeHTML){
            message = CHAT.Components.Transfer.escapeHtml(message);
        }
        const messageArray = message.split(HD.String.createRegExp(disablePattern));
        if (CHAT.Config.messageSend.imageReplacement.allowed){
            let image;
            const images = CHAT.Config.messageSend.imageReplacement.images;
            for (image in images){
                const escapedIcon = image.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
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
    appendUserMessage : function(box, data, highlighted = false){
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const userName = CHAT.Components.User.getName(data.userId);

        List.elem().innerHTML += `
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? 'self' : ''}">${CHAT.Components.Transfer.escapeHtml(userName)}</strong>:
                <br />${CHAT.Components.Transfer.replaceMessage(data.message)}
            </li>
        `;
    },

    /**
     * Rendszerüzenet beszúrása
     * @param {HTMLElement} box
     * @param {String} type - 'join'|'leave'|'forceJoinYou'|'forceJoinOther'|'forceLeaveYou'|'forceLeaveOther'
     * @param {Number} fromId
     * @param {Number} [toId=null]
     */
    appendSystemMessage : function(box, type, fromId, toId = null){
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const fromUserName = CHAT.Components.User.getName(fromId);
        const toUserName = CHAT.Components.User.getName(toId);

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
    appendFile : function(box, data, highlighted = false){
        let tpl, imgSrc;
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const userName = CHAT.Components.User.getName(data.userId);

        const ListItem = HD.DOM(`
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? 'self' : ''}">${CHAT.Components.Transfer.escapeHtml(userName)}</strong>:
                <br />
                <div class="filedisplay"></div>
            </li>
        `);
        const tplError = `
            <a href="${data.file}" target="_blank">${CHAT.Labels.file.error}</a>
        `;
        if (data.type === 'image'){
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
     * @param {Boolean} [cancelable=true]
     * @returns {Number|null}
     */
    progressbar : function(box, direction, percent, barId, cancelable = true){
        percent = Math.round(percent * 100);
        const List = HD.DOM(box).find(CHAT.DOM.list);
        const tpl = `
            <li>
                <div class="progressbar" data-id="{BARID}">
                    <span class="label">${CHAT.Labels.file[direction]}</span>
                    <span class="cancel" title="${CHAT.Labels.file.cancel}"></span>
                    <span title="${CHAT.Labels.file.cancel}">
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
            List.elem().innerHTML += tpl.replace('{BARID}', barId.toString());
            CHAT.Components.Box.scrollToBottom(box, true);
            if (cancelable){
                List.find('.cancel').event('click', function(){
                    const Progressbar = HD.DOM(this).ancestor('.progressbar');
                    CHAT.Events.Client.abortFile(Progressbar.elem());
                    HD.DOM(this).class('add', 'hidden');
                });
            }
            else {
                List.find('.cancel').class('add', 'hidden');
            }
            return barId;
        }
        else {
            const Progressbar = List.find('.progressbar').filter(`[data-id="${barId}"]`);
            if (direction === 'abort'){
                Progressbar.find('.label').elem().innerHTML = CHAT.Labels.file[direction];
                Progressbar.find('.line').class('add', 'aborted');
            }
            else {
                if (percent === 100){
                    Progressbar.find('.label').elem().innerHTML = CHAT.Labels.file[`${direction}End`];
                    Progressbar.find('.line').class('add', 'finished');
                    Progressbar.find('.cancel').class('add', 'hidden');
                }
                Progressbar.find('.line').css({'width' : `${percent}%`});
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
            ${CHAT.Labels.file.read}
        `;

        if (operation === 'show'){
            Progress.find(CHAT.DOM.progressText).elem().innerHTML = tpl;
            Progress.class('remove', 'hidden');
        }
        else {
            Progress.class('add', 'hidden');
            Progress.find(CHAT.DOM.progressText).elem().innerHTML = '';
        }
    }

};
