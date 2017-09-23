/* global HD */

'use strict';

var CHAT = (typeof global !== 'undefined' ? global.CHAT : window.CHAT) || {};

/**
 * Rendszer által kiírt szövegek
 * @type {Object}
 */
CHAT.Labels = {
    // Rendszerüzenetek
    system : {
        join : (fromUserName) =>
            `${fromUserName} csatlakozott`,
        leave : (fromUserName) =>
            `${fromUserName} kilépett`,
        forceJoinYou : (fromUserName) =>
            `${fromUserName} hozzáadott ehhez a csatornához`,
        forceJoinOther : (fromUserName, toUserName) =>
            `${fromUserName} hozzáadta ${toUserName} felhasználót ehhez a csatornához`,
        forceLeaveYou : (fromUserName) =>
            `${fromUserName} kidobott`,
        forceLeaveOther : (fromUserName, toUserName) =>
            `${fromUserName} kidobta ${toUserName} felhasználót`
    },
    // Tájékoztató feliratok
    legend : {
        haveToLogIn : 'A chat használatához be kell jelentkezned!',
        message : 'Üzenet',
        sendMode : 'Küldés enter megnyomására',
        dropFile : 'Ide húzd a fájlokat amiket át akarsz küldeni!'
    },
    // Felhasználó által kiváltott műveletek
    action : {
        chatStart : 'Chat',
        sendMessage : 'Küldés',
        sendFile : 'Fájlküldés',
        smiley : 'Emoticon beszúrása',
        leave : 'Kilépés',
        minimize : 'Összecsukás',
        resize : {
            toggle : 'Átméretezés',
            box : 'Doboz méret',
            container : 'Konténer méret',
            window : 'Teljes ablak méret',
            screen : 'Teljes képernyő méret'
        },
        sound : 'Hangos értesítések',
        settings : 'Beállítások',
        forceJoin : 'Hozzáadás',
        forceLeave : 'Kidobás'
    },
    // Felhasználó státusza
    status : {
        on : 'Elérhető',
        busy : 'Elfoglalt',
        away : 'Elment',
        inv : 'Lopakodó',
        off : 'Offline',
        idle : 'Tétlen'
    },
    // Fájlátvitel
    file : {
        read : 'Fájl beolvasása...',
        send : 'Fájlküldés...',
        get : 'Fájlfogadás...',
        abort : 'Fájlátvitel megszakítva',
        forceAbort : 'A fájlátvitelt a rendszer megszakította',
        sendEnd : 'Fájlküldés befejeződött',
        getEnd : 'Fájlfogadás befejeződött',
        cancel : 'Megszakítás',
        percent : (p) => `${p}%`,
        error : 'Hiba a fájl betöltése közben',
        deleted : 'A fájlküldés meg lett szakítva vagy a fájl törölve lett',
        types : {
            image : 'Kép',
            text  : 'Szöveges fájl',
            code  : 'Forráskód',
            pdf   : 'PDF dokumentum',
            doc   : 'Word dokumentum',
            xls   : 'Excel dokumentum',
            ppt   : 'Diavetítés',
            zip   : 'Tömörített állomány',
            audio : 'Hangfájl',
            video : 'Videófájl',
            exec  : 'Futtatható állomány',
            file  : 'Ismeretlen fájltípus'
        }
    },
    // Üzenetátvitel
    message : {
        stillWrite : (userName) => `${userName} éppen ír...`,
        stopWrite : (userName) => `${userName} szöveget írt be`
    },
    // Értesítések
    notification : {
        // Általános értesítések
        general : {
            message : (fromUserName) =>
                `${fromUserName} üzenetet írt`,
            file : (fromUserName) =>
                `${fromUserName} fájlt küldött`,
            create : (fromUserName) =>
                `${fromUserName} létrehozott egy csatornát`,
            join : (fromUserName) =>
                `${fromUserName} csatlakozott a csatornához`,
            leave : (fromUserName) =>
                `${fromUserName} elhagyta a csatornát`,
            forceJoinYou : (fromUserName) =>
                `${fromUserName} csatlakoztatott egy csatornához`,
            forceJoinOther : (fromUserName, toUserName) =>
                `${fromUserName} hozzáadta ${toUserName} felhasználót egy csatornához`,
            forceLeaveYou : (fromUserName) =>
                `${fromUserName} kidobott egy csatornából`,
            forceLeaveOther : (fromUserName, toUserName) =>
                `${fromUserName} kidobta ${toUserName} felhasználót az egyik csatornából`
        },
        // Helyi értesítések
        local : {
            message : (fromUserName) =>
                `${fromUserName} üzenetet írt`,
            file : (fromUserName) =>
                `${fromUserName} fájlt küldött`,
            join : (fromUserName) =>
                `${fromUserName} csatlakozott ehhez a csatornához`,
            leave : (fromUserName) =>
                `${fromUserName} elhagyta ezt a csatornát`,
            forceJoinOther : (fromUserName, toUserName) =>
                `${fromUserName} hozzáadta ${toUserName} felhasználót ehhez a csatornához`,
            forceLeaveYou : (fromUserName) =>
                `${fromUserName} kidobott`,
            forceLeaveOther : (fromUserName, toUserName) =>
                `${fromUserName} kidobta ${toUserName} felhasználót`
        },
        // Asztali értestések
        desktop : {
            options : {
                // Írás iránya ('auto'|'ltr'|'rtl')
                dir : 'auto',
                // Nyelv
                lang : 'HU',
                // Az értesítés "title" része alatti szöveg
                // body : '',
                // A szöveg melletti kép
                icon : '/images/notification.png'
            },
            message : (fromUserName) =>
                `${fromUserName} üzenetet írt`,
            file : (fromUserName) =>
                `${fromUserName} fájlt küldött`,
            create : (fromUserName) =>
                `${fromUserName} létrehozott egy csatornát`,
            join : (fromUserName) =>
                `${fromUserName} csatlakozott a csatornához`,
            leave : (fromUserName) =>
                `${fromUserName} elhagyta a csatornát`,
            forceJoinYou : (fromUserName) =>
                `${fromUserName} csatlakoztatott egy csatornához`,
            forceJoinOther : (fromUserName, toUserName) =>
                `${fromUserName} hozzáadta ${toUserName} felhasználót egy csatornához`,
            forceLeaveYou : (fromUserName) =>
                `${fromUserName} kidobott egy csatornából`,
            forceLeaveOther : (fromUserName, toUserName) =>
                `${fromUserName} kidobta ${toUserName} felhasználót az egyik csatornából`
        }
    },
    // Idő kijelzése
    time : {
        // Idő mértékegységek
        idleTimer : ['nap', 'óra', 'perc', 'másodperc'],
        // Még sosem volt aktív
        notYetOnline : '-',
        // Kevesebb, mint 1 perce volt aktív
        lessThanMin : 'most'
    },
    // Hibaüzenetek
    error : {
        maxUsers : (maxUser) =>
            `Legfeljebb ${maxUser} felhasználó lehet egy csatornában!`,
        fileAllowed : () =>
            `Fájlfeltöltés nincs engedélyezve!`,
        fileSize : (size, maxSize) =>
            `Túl nagy a fájl mérete (${HD.Number.displaySize(size)})!
            Maximális méret: ${HD.Number.displaySize(maxSize)}.`,
        fileType : (type, allowedTypes) =>
            `Nem megfelelő a fájl típusa (${CHAT.Labels.file.types[type]})!
            Megengedett típusok: ${allowedTypes.map(t => CHAT.Labels.file.types[t]).join(', ')}.`
    }
};

if (typeof exports !== 'undefined'){
    exports.Labels = CHAT.Labels;
}
