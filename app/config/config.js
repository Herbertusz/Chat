'use strict';

var CHAT = global.CHAT || {};

/**
 * Chat beállításai
 * @type {Object}
 */
CHAT.Config = {

    // Alapértelmezett szöveg a title tegben
    defaultTitle : 'HD-Chat',

    // Csatorna-műveletek
    room : {
        // Felhasználók maximális száma egy csatornában (falsy érték: tetszőleges)
        maxUsers : false,
        // Új user hozzáadásának engedélyezése
        forceJoin : true,
        // User kidobásának engedélyezése
        forceLeave : true,
        // User kidobása a csatornákból kapcsolat megszakadása (pl. elnavigáléás, frissítés) esetén
        leaveOnDisconnect : false
    },

    // Felhasználó állapotai
    status : {
        // Online állapotok (felhasználó által beállíthatóak, az első az alapértelmezett)
        online : ['on', 'busy', 'away', 'inv'],
        // Offline állapotok (az első az alapértelmezett)
        offline : ['off'],
        // Aktívnak tekintett állapotok
        active : ['on', 'busy'],
        // Inaktívnak tekintett állapotok
        inactive : ['idle', 'away', 'inv', 'off'],
        // Tétlen állapot érzékelése
        idle : {
            // Tétlen állapot érzékelésének engedélyezése
            allowed : true,
            // Tétlen állapot figyelmen kívül hagyása ezeknél az állapotoknál (megjelenítéshez)
            except : ['inv', 'away'],
            // Várakozás tétlen állpotba állítás előtt ms-ban (5 perc)
            time : 300000,
            // Tétlen vagy offline állapotba lépés óta eltelt idő mérése
            timeCounter : true
        }
    },

    // Chat-doboz beállítások
    box : {
        // Alapértelmezett doboz méret
        defaultSize : {
            width : 300,
            height : 500
        },
        // Méretkorlátozás (falsy érték esetén nincs korlát)
        sizeRestriction : {
            minWidth : 240,
            minHeight : 300,
            maxWidth : 650,
            maxHeight : 500
        },
        // Hibaüzenetek
        error : {
            // Hibaüzenet eltüntetése előtt eltelt idő ms-ban (falsy érték esetén nem tűnik el)
            messageWait : false
        }
    },

    // Értesítések
    notification : {
        // Értesítések engedélyezése (hibaüzenetekre nem vonatkozik)
        allowed : true,
        // Üzenetírás értesítések
        writing : {
            // Üzenetírás értesítések engedélyezése
            allowed : true
        },
        // Helyi értesítések
        local : {
            // Helyi értesítések engedélyezése
            allowed : true,
            // Helyi értesítés és scrollozás választóvonala (px)
            // Ha ennél nagyobb értékkel van feljebb görgetve a doboz, akkor értesítés érkezik, egyébként legörgeti a
            // dobozt (egy üzenet magasságánál nagyobb érték javasolt)
            scroll : 200
        },
        // Vizuális értesítés
        visual : {
            // Vizuális értesítés engedélyezése
            allowed : true,
            // Vizuális értesítés typusai
            // 'title': <title> teg változtatésa; 'box': chat-doboz kiemelése
            types : ['title', 'box']
        },
        // Hangos értesítés
        sound : {
            // Hangos értesítés engedélyezése
            allowed : false,
            // Különféle értesítések esetén lejátszódó hangfájlok
            audio : {
                'message'         : '/audio/send.mp3',
                'file'            : '/audio/send.mp3',
                'create'          : '/audio/join.mp3',
                'join'            : '/audio/join.mp3',
                'leave'           : '/audio/leave.mp3',
                'forceJoinYou'    : '/audio/join.mp3',
                'forceJoinOther'  : '/audio/join.mp3',
                'forceLeaveYou'   : '/audio/leave.mp3',
                'forceLeaveOther' : '/audio/leave.mp3'
            }
        },
        // Asztali értesítés
        desktop : {
            // Asztali értesítés engedélyezése
            allowed : false,
            // Értesítés eltüntetése előtt eltelt idő (ms) (falsy érték: a program nem tünteti el)
            closeTime : 10000,
            // Asztali értesítés beállításai (a Notification() konstruktor második argumentuma)
            options : {
                // Ha megadjuk, az alkalmazástól származó értesítések össze lesznek vonva
                tag : 'hd-chat',
                // Vibrációs minta (ha van rezgést biztosító hardver)
                vibrate : [100],
                // Automatikus eltüntetés letiltása
                requireInteraction : true
            }
        }
    },

    // Üzenetküldés
    textTransfer : {

        // HTML escape-elés a küldött üzenetben
        escapeHTML : true,

        // A mintán belül nincs kép- és szövegcsere
        replaceDisable : /`(.*)`/,

        // Képcsere (karakterláncok képekre cserélése, pl emoticon-ok)
        imageReplacement : {
            // Képcsere engedélyezése
            allowed : true,
            // Képekre cserélendő karakterláncok
            images : {
                ':)' : '/images/emoticons/01.gif',
                ':D' : '/images/emoticons/02.gif',
                ':]' : '/images/emoticons/03.gif',
                '8)' : '/images/emoticons/04.gif',
                ';)' : '/images/emoticons/05.gif',
                ':?' : '/images/emoticons/06.gif',
                '8|' : '/images/emoticons/07.gif',
                'X(' : '/images/emoticons/08.gif',
                ':(' : '/images/emoticons/09.gif',
                ';(' : '/images/emoticons/10.gif',
                ':+' : '/images/emoticons/11.gif',
                ':-' : '/images/emoticons/12.gif',
                ':b' : '/images/emoticons/13.gif',
                ':i' : '/images/emoticons/14.gif',
                ':w' : '/images/emoticons/15.gif',
                ':q' : '/images/emoticons/16.gif'
            }
        },

        // Szövegcsere (karakterláncok más karakterláncokra cserélése, pl BB-kódok)
        stringReplacement : {
            // Szöveglecsere engedélyezése
            allowed : true,
            // Karakterlánc cserék
            strings : [
                [/\*\*(.*?)\*\*/g,                 '<strong>$1</strong>'],
                [/__(.*?)__/g,                     '<em>$1</em>'],
                [/--(.*?)--/g,                     '<span style="text-decoration: line-through;">$1</span>'],
                [/\[color=(.*?)](.*?)\[\/color]/g, '<span style="color: $1;">$2</span>'],
                [
                    /((https?:)?\/\/(www\.)?([-a-zA-Z0-9@:%._+~#=]{2,256})\.([a-z]{2,6})\b([-a-zA-Z0-9@:%_+.~#?&/=]*))/g,
                    '<a href="$1" target="_blank">$1</a>'
                ]
            ]
        },

        // Üzenetküldési mód
        sendMode : {
            // Üzenetküldési mód változtatási lehetősége
            allowed : true,
            // Alapértelmezett üzenetküldési mód
            // 'enter': enter megnyomására; 'button': gombra kattintva
            default : 'enter'
        }

    },

    // Fájlátvitel
    fileTransfer : {

        // Fájlátvitel engedélyezése
        allowed : true,

        // Fájl átviteli módja a fájl méretétől föggően (növekvő sorrendben kell megadni)
        // 'base64': base64 string átvitele; 'zip': tömörített base64 átvitele; 'upload': feltöltés szerverre
        // Javaslat: 'base64': <5MB
        store : {
            base64 :       1024 * 1024,  // 0 MB - 1 MB
            // zip    :   2 * 1024 * 1024,  // 1 MB - 2 MB  // TODO
            upload : 100 * 1024 * 1024   // 2 MB - 100 MB
        },

        // Egyszerre több fájl átvitelének engedélyezése
        multiple : true,

        // Drag-n-drop-os fájlválasztás engedélyezése
        dragndrop : true,

        // Fájltípusok definiálása mime típus alapján
        types : {
            image : /^image\/.*$/,
            text  : /^(text\/plain)$/,
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

        // Meghatározatlan fájltípus definiálása kiterjesztés alapján
        typeFallback : {
            text : ['log', 'ini'],
            zip  : ['7z', 'ace', 'cab', 'gz', 'rar', 'tgz', 'zip'],
            exec : ['bat', 'sh', 'reg'],
            code : [
                'asm', 'asp', 'awk', 'c', 'cpp', 'css', 'h', 'hpp', 'htc', 'htm', 'html', 'inc',
                'java', 'js', 'jsp', 'php', 'pl', 'pm', 'sh', 'sql', 'src', 'xmd', 'xml', 'xsl'
            ]
        },

        // Engedélyezett fájltípusok a types és typeFallback tulajdonságban definiáltak közül
        allowedTypes : ['image', 'text', 'pdf', 'doc', 'xls', 'ppt', 'zip', 'audio', 'video', 'exec', 'code', 'file']

    }

};

exports.Config = CHAT.Config;
