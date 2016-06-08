"use strict";

var CHAT = global.CHAT || {};

/**
 * Chat beállításai
 * @type {Object}
 */
CHAT.Config = {

    // Hibaüzenetek
    error : {
        // Hibaüzenet eltüntetése előtt eltelt idő
        messageWait : 6000
    },

    // Értesítések
    notification : {
        // Értesítések engedélyezése
        allowed : true,
        // Vizuális értesítés
        visual : {
            // Vizuális értesítés engedélyezése
            allowed : true,
            // Vizuális értesítés typusai
            // "title": <title> teg változtatésa; "box": chat-doboz kiemelése
            types : ['title', 'box']
        },
        // Hangos értesítés
        sound : {
            // Hangos értesítés engedélyezése
            allowed : true,
            // Értesítés esetén lejátszandó hangfájl
            audio : '/audio/notification.mp3'
        }
    },

    // Üzenetküldés
    messageSend : {

        // HTML escape-elés a küldött üzenetben
        escapeHTML : true,

        // A mintán belül nincs emoticon és bb-kód csere
        replaceDisable : /`(.*)`/,

        // Emoticon lecserélés
        emoticonReplacement : {
            // Emoticon lecserélés engedélyezése
            allowed : true,
            // Képekre cserélendő karakterláncok
            emoticons : {
                ':)'       : '/images/emoticons/01.gif',
                ':D'       : '/images/emoticons/02.gif',
                ':]'       : '/images/emoticons/03.gif',
                '8)'       : '/images/emoticons/04.gif',
                ';)'       : '/images/emoticons/05.gif',
                ':?'       : '/images/emoticons/06.gif',
                '8|'       : '/images/emoticons/07.gif',
                'X('       : '/images/emoticons/08.gif',
                ':('       : '/images/emoticons/09.gif',
                ';('       : '/images/emoticons/10.gif',
                ':like'    : '/images/emoticons/11.gif',
                ':dislike' : '/images/emoticons/12.gif',
                ':bug'     : '/images/emoticons/13.gif',
                ':i'       : '/images/emoticons/14.gif',
                ':w'       : '/images/emoticons/15.gif',
                ':q'       : '/images/emoticons/16.gif',
                ':alien'   : '/images/emoticons/17.gif'
            }
        },

        // BB-kód lecserélés
        bbCodeReplacement : {
            // BB-kód lecserélés engedélyezése
            allowed : true,
            // Karakterlánc cserék
            bbCodes : [
                [/\*\*(.*?)\*\*/g,                 '<strong>$1</strong>'],
                [/__(.*?)__/g,                     '<em>$1</em>'],
                [/--(.*?)--/g,                     '<span style="text-decoration: line-through;">$1</span>'],
                [/\[color=(.*?)](.*?)\[\/color]/g, '<span style="color: $1;">$2</span>'],
                [
                    /((https?:)?\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256})\.([a-z]{2,6})\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*))/g,
                    '<a href="$1" target="_blank">$1</a>'
                ]
            ]
        },

        // Üzenetküldési mód
        sendMode : {
            // Üzenetküldési mód változtatási lehetősége
            allowed : true,
            // Alapértelmezett üzenetküldési mód
            // "enter": enter megnyomására; "button": gombra kattintva
            default : 'enter'
        }

    },

    // Fájlátvitel
    fileTransfer : {

        // Fájlátvitel engedélyezése
        allowed : true,

        // Fájl átviteli módja
        // "upload": feltöltés szerverre; "base64": base64 string átvitele; "zip": tömörített base64 átvitele
        store : 'upload',

        // Egyszerre több fájl átvitelének engedélyezése
        multiple : true,

        // Drag-n-drop-os fájlválasztás
        dragndrop : {
            // Drag-n-drop-os fájlválasztás engedélyezése
            allowed : true,
            // Drop felületre írt szöveg
            html : 'Ide húzd a fájlokat amiket át akarsz küldeni!'
        },

        // Fájltípusok definiálása mime típus alapján
        types : {
            image : /^image\/.*$/,
            text  : /^(text\/.*|.*javascript|.*ecmascript)$/,
            pdf   : /^application\/pdf$/,
            doc   : /^.*(msword|ms-word|wordprocessingml).*/,
            xls   : /^.*(ms-excel|spreadsheetml).*$/,
            ppt   : /^.*(ms-powerpoint|presentationml).*$/,
            zip   : /^.*(zip|compressed).*$/,
            audio : /^audio\/.*$/,
            video : /^video\/.*$/,
            exec  : /^application\/(octet-stream|x-msdownload|(x-|dos-|x-win)?exe|msdos-windows|x-msdos-program)$/,
            file  : /^.*$/
        },

        // Engedélyezett fájltípusok a types tulajdonságban definiáltak közül
        allowedTypes : ["image", "text", "pdf", "doc", "xls", "ppt", "zip", "audio", "video"],

        // Fájl maximális mérete
        // Javaslat: "upload": <100MB; "base64": <10MB
        maxSize : 100 * 1024 * 1024

    }

};

exports.Config = CHAT.Config;
