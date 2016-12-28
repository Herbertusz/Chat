/* global HD */

'use strict';

var CHAT = window.CHAT || {};
CHAT.Components = CHAT.Components || {};

/**
 * Időméréshez használt tárolók
 * @type {Object}
 */
CHAT.Components.Timer = {
    /**
     * Gépelés
     * @type {Object}
     */
    writing : {
        timerID : 0,
        interval : 1000,
        event : false,
        message : ''
    },
    /**
     * Tételen állapotba lépés
     * @type {Number}
     */
    idle : CHAT.Config.idle.time,
    /**
     * Felhasználókhoz kapcsolt idle-időmérők
     * @type {Object}
     * @description
     * counters = {
     *     `user-${userId}` : HD.DateTime.Timer,
     *     ...
     * }
     */
    counters : {}
};
