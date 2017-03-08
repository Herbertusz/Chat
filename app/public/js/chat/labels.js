/* global HD */

'use strict';

var CHAT = (typeof global !== 'undefined' ? global.CHAT : window.CHAT) || {};

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
    // Tájékoztató feliratok
    'legend' : {
        'haveToLogIn' : 'A chat használatához be kell jelentkezned!',
        'message' : 'Üzenet',
        'sendMode' : 'Küldés enter megnyomására',
        'dropFile' : 'Ide húzd a fájlokat amiket át akarsz küldeni!'
    },
    // Felhasználó által kiváltott műveletek
    'action' : {
        'chatStart' : 'Chat',
        'sendMessage' : 'Küldés',
        'sendFile' : 'Fájlküldés',
        'leave' : 'Kilépés',
        'forceJoin' : 'Hozzáadás',
        'forceLeave' : 'Kidobás'
    },
    // Felhasználó státusza
    'status' : {
        'on' : 'Elérhető',
        'busy' : 'Elfoglalt',
        'away' : 'Elment',
        'inv' : 'Lopakodó',
        'off' : 'Offline',
        'idle' : 'Tétlen'
    },
    // Fájlátvitel
    'file' : {
        'read' : 'Fájl beolvasása...',
        'send' : 'Fájlküldés...',
        'get' : 'Fájlfogadás...',
        'abort' : 'Fájlátvitel megszakítva',
        'sendEnd' : 'Fájlküldés befejeződött',
        'getEnd' : 'Fájlfogadás befejeződött',
        'cancel' : 'Megszakítás',
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
    // Idő kijelzése
    'time' : {
        'idleTimer' : ['nap', 'óra', 'perc', 'másodperc'],
        'notYetOnline' : '-',
        'lessThanMin' : 'most'
    },
    // Hibaüzenetek
    'error' : {
        'fileSize' : (size, maxSize) =>
            `Túl nagy a fájl mérete (${HD.Number.displaySize(size)}, max: ${HD.Number.displaySize(maxSize)})`,
        'fileType' : (type, allowedTypes) =>
            `Nem megfelelő a fájl típusa (${type}, megengedett typusok: ${allowedTypes.join(', ')})`
    }
};

if (typeof exports !== 'undefined'){
    exports.Labels = CHAT.Labels;
}
