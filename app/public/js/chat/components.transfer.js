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
            const Box = HD.DOM(this).ancestors(CHAT.DOM.box);

            if (event.which !== HD.Misc.keys.ENTER){
                CHAT.Events.Client.typeMessage(Box.elem());
            }
        });

        // Üzenetküldés indítása ENTER leütésére
        CHAT.DOM.inBox(CHAT.DOM.textarea).event('keydown', function(event){
            const Box = HD.DOM(this).ancestors(CHAT.DOM.box);

            if (event.which === HD.Misc.keys.ENTER){
                if (!event.shiftKey && Box.descendants(CHAT.DOM.sendSwitch).prop('checked')){
                    CHAT.Events.Client.sendMessage(Box.elem());
                    event.preventDefault();
                }
            }
        });

        // Üzenetküldés indítása gombnyomásra
        CHAT.DOM.inBox(CHAT.DOM.sendButton).event('click', function(){
            const Box = HD.DOM(this).ancestors(CHAT.DOM.box);
            CHAT.Events.Client.sendMessage(Box.elem());
        });

        // Üzenetküldés módja
        CHAT.DOM.inBox(CHAT.DOM.sendSwitch).event('change', function(){
            CHAT.Events.Client.sendMethod(this);
        });

        // Előredefiniált karakterlánc beszúrás
        CHAT.DOM.inBox(CHAT.DOM.imageReplacementToggle).event('click', function(){
            CHAT.DOM.inBox(CHAT.DOM.imageReplacementList).class('toggle', 'active');
        });
        CHAT.DOM.inBox(`${CHAT.DOM.imageReplacementItems}`).event('click', function(){
            const Item = HD.DOM(this);

            CHAT.Components.Transfer.insertText(Item.ancestors(CHAT.DOM.box).elem(), Item.data('string'));
            CHAT.DOM.inBox(CHAT.DOM.imageReplacementList).class('remove', 'active');
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
                Trigger.ancestors(CHAT.DOM.box).descendants(CHAT.DOM.file).trigger('click');
            }
        });
        CHAT.DOM.inBox(CHAT.DOM.file).event('change', function(){
            const Box = HD.DOM(this).ancestors(CHAT.DOM.box);
            const files = Box.descendants(CHAT.DOM.file).elem().files;

            if (files.length > 0){
                CHAT.Events.Client.sendFile(Box.elem(), files);
            }
        });

        // Fájlküldés (drag-n-drop)
        if (CHAT.Config.fileTransfer.dragndrop){
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
                    const Box = HD.DOM(this).ancestors(CHAT.DOM.box);
                    const files = event.dataTransfer.files;
                    CHAT.Events.Client.sendFile(Box.elem(), files);
                });
        }
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
     * Karakterlánc beszúrása a szövegmezőbe
     * @param {HTMLElement} box
     * @param {String} text
     */
    insertText : function(box, text){
        const textarea = HD.DOM(box).descendants(CHAT.DOM.textarea).elem();

        textarea.value += ` ${text}`;
        textarea.focus();
    },

    /**
     * Módosítások az elküldött szövegben
     * @param {String} message
     * @returns {String}
     */
    replaceMessage : function(message){
        const disablePattern = CHAT.Config.textTransfer.replaceDisable;
        if (CHAT.Config.textTransfer.escapeHTML){
            message = CHAT.Components.Transfer.escapeHtml(message);
        }
        const messageArray = message.split(HD.String.createRegExp(disablePattern));
        if (CHAT.Config.textTransfer.imageReplacement.allowed){
            let image;
            const images = CHAT.Config.textTransfer.imageReplacement.images;
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
        if (CHAT.Config.textTransfer.stringReplacement.allowed){
            const strings = CHAT.Config.textTransfer.stringReplacement.strings;
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
     *     room : String
     * }
     */
    appendUserMessage : function(box, data, highlighted = false){
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const List = HD.DOM(box).descendants(CHAT.DOM.list);
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
        const List = HD.DOM(box).descendants(CHAT.DOM.list);
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
     *     raw : {
     *         name : String,
     *         size : Number,
     *         type : String,
     *         source : String
     *     },
     *     store : String,
     *     type : String,
     *     time : Number,
     *     room : String,
     *     name : String,
     *     deleted : Boolean
     * }
     */
    appendFile : function(box, data, highlighted = false){
        let tpl, imgSrc;
        const List = HD.DOM(box).descendants(CHAT.DOM.list);
        const time = HD.DateTime.formatMS('Y-m-d H:i:s', data.time);
        const userName = CHAT.Components.User.getName(data.userId);
        const fileSrc = data.store === 'upload' ?
            `/chat/file/${HD.DOM(box).data('room')}/${data.raw.source}` :
            data.raw.source;

        const ListItem = HD.DOM(`
            <li>
                <span class="time">${time}</span>
                <strong class="${highlighted ? 'self' : ''}">${CHAT.Components.Transfer.escapeHtml(userName)}</strong>:
                <br />
                <div class="filedisplay"></div>
            </li>
        `);
        const tplError = `
            <a href="${fileSrc}" target="_blank">${CHAT.Labels.file.error}</a>
        `;

        if (data.type === 'image'){
            imgSrc = fileSrc;
            tpl = `
                <a class="image" href="${fileSrc}" target="_blank">
                    <img class="send-image" alt="${data.raw.name}" src="${imgSrc}" />
                </a>
            `;
        }
        else {
            imgSrc = '/images/filetypes.png';
            tpl = `
                <a class="file" href="${fileSrc}" target="_blank" title="${CHAT.Labels.file.types[data.type]}">
                    <span class="filetype filetype-${data.type}"></span>
                    <span class="text">${data.raw.name}</span>
                </a>
            `;
        }

        const img = document.createElement('img');
        const promise = (new Promise(function(resolve, reject){
            img.onload = resolve;
            img.onerror = reject;
        })).then(function(){
            ListItem.descendants('.filedisplay').elem().innerHTML = tpl;
            List.elem().appendChild(ListItem.elem());
        }).catch(function(error){
            HD.Log.error(error);
            ListItem.descendants('.filedisplay').elem().innerHTML = tplError;
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
        const List = HD.DOM(box).descendants(CHAT.DOM.list);
        const tpl = `
            <li>
                <div class="progressbar" data-id="{BARID}">
                    <span class="label">${CHAT.Labels.file[direction]}</span>
                    <span title="${CHAT.Labels.file.cancel}">
                        <svg class="cancel"><use xlink:href="#cross"></use></svg>
                    </span>
                    <span class="current-value">
                        <span class="linecontainer">
                            <span class="line" style="width: ${percent}%"></span>
                        </span>
                        <span class="numeric">${CHAT.Labels.file.percent(percent)}</span>
                    </span>
                </div>
            </li>
        `;

        if (!barId){
            barId = HD.Number.getUniqueId();
            List.elem().innerHTML += tpl.replace('{BARID}', barId.toString());
            CHAT.Components.Box.scrollToBottom(box, true);
            if (cancelable){
                List.descendants('.cancel').event('click', function(){
                    const Progressbar = HD.DOM(this).ancestors('.progressbar');
                    CHAT.Events.Client.abortFile(Progressbar.elem());
                    HD.DOM(this).class('add', 'hidden');
                });
            }
            else {
                List.descendants('.cancel').class('add', 'hidden');
            }
            return barId;
        }
        else {
            const Progressbar = List.descendants('.progressbar').filter(`[data-id="${barId}"]`);
            if (direction === 'abort' || direction === 'forceAbort'){
                Progressbar.descendants('.label').elem().innerHTML = CHAT.Labels.file[direction];
                Progressbar.descendants('.line').class('add', 'aborted');
            }
            else {
                if (percent === 100){
                    Progressbar.descendants('.label').elem().innerHTML = CHAT.Labels.file[`${direction}End`];
                    Progressbar.descendants('.line').class('add', 'finished');
                    Progressbar.descendants('.cancel').class('add', 'hidden');
                }
                Progressbar.descendants('.line').css({'width' : `${percent}%`});
                Progressbar.descendants('.numeric').elem().innerHTML = CHAT.Labels.file.percent(percent);
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
        const Progress = HD.DOM(box).descendants(CHAT.DOM.progress);
        const tpl = `
            ${CHAT.Labels.file.read}
        `;

        if (operation === 'show'){
            Progress.descendants(CHAT.DOM.progressText).elem().innerHTML = tpl;
            Progress.class('remove', 'hidden');
        }
        else {
            Progress.class('add', 'hidden');
            Progress.descendants(CHAT.DOM.progressText).elem().innerHTML = '';
        }
    }

};
