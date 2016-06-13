/*!
 * HD-keret Timer v1.0.2
 * 2015.08.15.
 *
 * @description időmérő
 * @example
 *  var timer = new HD.DateTime.Timer(-1);
 *  timer.set("00:10");
 *  timer.start(function(){
 *      element.innerHTML = this.get("mm:ss");
 *  }).reach(0, function(){
 *      this.stop();
 *  });
 */

/* global HD namespace */

"use strict";

var HD = namespace("HD");
HD.DateTime = namespace("HD.DateTime");

/**
 * Időmérő objektum (Module minta)
 * @param {Number} add lépegetés (pl: stoppernél 1, visszaszámlálónál -1)
 * @param {Number} [stepInterval=1000] lépések között eltelt idő (ms)
 * @returns {Timer} timer felület
 */
HD.DateTime.Timer = function(add, stepInterval){

    var T, timerID, run, events, step, parse, print, Interface;

    if (typeof stepInterval === "undefined") stepInterval = 1000;

    /**
     * Eltelt időegység (másodpercben)
     * @type {Number}
     * @private
     */
    T = 0;

    /**
     * Timeout ID
     * @type {Number}
     * @private
     */
    timerID = null;

    /**
     * Időmérő állapota
     * @type {Boolean}
     * @private
     */
    run = false;

    /**
     * Eseménykezelők
     * @type {Array}
     * @description szerkezet: [
     *     {
     *         value : Number,        // érték
     *         handler : Function,    // eseménykezelő
     *         context : Object    // this = Timer
     *     }
     * ]
     */
    events = [];

    /**
     * Léptetés
     */
    step = function(){
        var n;
        T += add;
        if (events.length > 0){
            for (n = 0; n < events.length; n++){
                if (T === events[n].value){
                    events[n].handler.call(events[n].context);
                }
            }
        }
    };

    /**
     * Bevitt idő beolvasása
     * @param {String} str időt leíró string (formátum: "hh:mm:ss"|"mm:ss"|"ss")
     * @returns {Number} időegység értéke
     */
    parse = function(str){
        var segments = str.split(":");
        var ms;
        if (segments.length === 1){
            str = `00:00:${str}`;
        }
        else if (segments.length === 2){
            str = `00:${str}`;
        }
        ms = Date.parse(`1 Jan 1970 ${str} GMT`);
        return Math.round(ms / 1000);
    };

    /**
     * Idő kiírása olvasható formában
     * @param {Number} num időegység értéke
     * @param {String} format formátum (makrók: h, m, s, H, M, S, hh, mm, ss)
     * @returns {String} kiírható string
     */
    print = function(num, format){
        var timeObj = new Date(num * 1000);
        var h = timeObj.getHours() - 1;
        var m = timeObj.getMinutes();
        var s = timeObj.getSeconds();
        var H = h;
        var M = h * 60 + m;
        var S = h * 60 * 60 + m * 60 + s;
        var hh = (h < 10) ? `0${h}` : `${h}`;
        var mm = (m < 10) ? `0${m}` : `${m}`;
        var ss = (s < 10) ? `0${s}` : `${s}`;
        h = h.toString(); m = m.toString(); s = s.toString();
        format = format.replace("hh", hh);
        format = format.replace("mm", mm);
        format = format.replace("ss", ss);
        format = format.replace("h", `${h}`);
        format = format.replace("m", `${m}`);
        format = format.replace("s", `${s}`);
        format = format.replace("H", `${H}`);
        format = format.replace("M", `${M}`);
        format = format.replace("S", `${S}`);
        return format;
    };

    Interface = {

        /**
         * Beállítás
         * @param {Number|String} value kezdőérték
         * @returns {Object} Timer objektum
         */
        set : function(value){
            if (typeof value === "string"){
                T = parse(value);
            }
            else {
                T = value;
            }
            return this;
        },

        /**
         * Aktuális idő
         * @param {String} [format] fomrátum
         * @returns {Number|String} aktuális idő
         */
        get : function(format){
            if (typeof format === "undefined"){
                return T;
            }
            else {
                return print(T, format);
            }
        },

        /**
         * Időmérés indítása
         * @param {Function} callback minden lépés után meghívott függvény
         * @returns {Object} Timer objektum
         */
        start : function(callback){
            if (!run){
                callback.call(this);
                timerID = window.setInterval(function(){
                    step();
                    callback.call(this);
                }.bind(this), stepInterval);
                run = true;
            }
            return this;
        },

        /**
         * Időmérés szüneteltetése
         * @returns {Object} Timer objektum
         */
        pause : function(){
            if (run){
                window.clearInterval(timerID);
                run = false;
            }
            return this;
        },

        /**
         * Időmérés leállítása
         * @returns {Object} Timer objektum
         */
        stop : function(){
            if (run){
                window.clearInterval(timerID);
                run = false;
            }
            T = 0;
            return this;
        },

        /**
         * Eseménykezelő csatolása
         * @param {Number|String} value időpont
         * @param {Function} callback eseménykezelő
         * @returns {Object} Timer objektum
         */
        reach : function(value, callback){
            if (typeof value === "string"){
                value = parse(value);
            }
            events.push({
                value : value,
                handler : callback,
                context : this
            });
            return this;
        }

    };

    return Interface;

};
