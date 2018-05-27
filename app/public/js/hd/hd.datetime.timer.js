/**
 * HD-keret Timer
 *
 * @description Idő alapú számláló
 * @requires HD.DateTime
 * @example
 *  Óra:
 *   const clock = new HD.DateTime.Timer(1);
 *   clock
 *       .set(Math.round(Date.now() / 1000))
 *       .start(function(){
 *           elementDisplay.innerHTML = this.get('hh:mm:ss');
 *       });
 *  // ----------------------------------------------------------------
 *  Visszaszámláló:
 *   const countDown = new HD.DateTime.Timer(-1);
 *   countDown.set('35:20:00:00'); // Fixen 35 nap 20 óra; az alábbi egy életszerűbb példa:
 *   // countDown.set(Math.round((Date.parse('1 Jan 2018 00:00:00 GMT') - Date.now()) / 1000));
 *   countDown
 *       .start(function(){
 *           elementDisplay.innerHTML = this.get('D nap, hh:mm:ss');
 *       })
 *       .reach(0, function(){
 *           this.stop();
 *       });
 *  // ----------------------------------------------------------------
 *  Stopper (tizedmásodperc pontosságú):
 *   const stopWatch = new HD.DateTime.Timer(0.1);
 *   elementStart.addEventListener('click', function(){
 *       stopWatch.start(function(){
 *           elementDisplay.innerHTML = this.get('mm:ss.') + Math.round(this.get() * 10) % 10;
 *       });
 *   });
 *   elementPause.addEventListener('click', function(){
 *       stopWatch.pause();
 *   });
 *   elementStop.addEventListener('click', function(){
 *       stopWatch.stop();
 *       elementDisplay.innerHTML = '00:00.0';
 *   });
 */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};
if (typeof global !== 'undefined'){
    HD = require('./hd.js')(['datetime']);
}

/**
 * Időmérő objektum (Module minta)
 * @param {Number} add - lépegetés (pl: stoppernél 1, visszaszámlálónál -1)
 * @param {Number} [stepInterval=null] - lépések között eltelt idő (ms)
 * @returns {Object} timer felület
 */
HD.DateTime.Timer = function(add, stepInterval = null){

    /**
     * Eltelt időegység (másodpercben)
     * @type {Number}
     * @private
     */
    let T = 0;

    /**
     * Timeout ID
     * @type {Object}
     * @private
     */
    let timerID = null;

    /**
     * Időmérő állapota
     * @type {Boolean}
     * @private
     */
    let run = false;

    /**
     * Eseménykezelők
     * @type {Array}
     * @description
     *  events = [
     *      {
     *          value : Number,     // érték
     *          handler : Function, // eseménykezelő
     *          context : Object    // this = Timer
     *      }
     *  ]
     */
    const events = [];

    /**
     * Léptetés
     */
    const step = function(){
        let n;
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
     * @param {String} str - időt leíró string (formátum: 'D:hh:mm:ss'|'hh:mm:ss'|'mm:ss'|'ss')
     * @returns {Number} időegység értéke
     */
    const parse = function(str){
        return HD.DateTime.parseTime(str, 's', 's');
    };

    /**
     * Idő kiírása olvasható formában
     * @param {Number} num - időegység értéke
     * @param {String} format - formátum (makrók: h, m, s, D, H, M, S, hh, mm, ss)
     * @returns {String} kiírható string
     */
    const print = function(num, format){
        return HD.DateTime.printTime(num, 's', format);
    };

    const Interface = {

        /**
         * Beállítás
         * @param {Number|String} value - kezdőérték
         * @returns {Object} Timer objektum
         */
        set : function(value){
            if (typeof value === 'string'){
                T = parse(value);
            }
            else {
                T = value;
            }
            return this;
        },

        /**
         * Aktuális idő
         * @param {String} [format] - formátum
         * @returns {Number|String} aktuális idő
         */
        get : function(format){
            if (typeof format === 'undefined'){
                return T;
            }
            else {
                return print(T, format);
            }
        },

        /**
         * Időmérés indítása
         * @param {Function} callback - minden lépés után meghívott függvény
         * @returns {Object} Timer objektum
         */
        start : function(callback){
            if (!run){
                callback.call(this, this);
                timerID = setInterval(function(){
                    step();
                    callback.call(this, this);
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
                clearInterval(timerID);
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
                clearInterval(timerID);
                run = false;
            }
            T = 0;
            return this;
        },

        /**
         * Eseménykezelő csatolása
         * @param {Number|String} value - időpont
         * @param {Function} callback - eseménykezelő
         * @returns {Object} Timer objektum
         */
        reach : function(value, callback){
            if (typeof value === 'string'){
                value = parse(value);
            }
            events.push({
                value : value,
                handler : callback,
                context : this
            });
            return this;
        },

        /**
         * Időmérő fut vagy meg van állítva
         * @returns {Boolean} true: fut
         */
        running : function(){
            return run;
        }

    };

    if (stepInterval === null){
        stepInterval = 1000 * add;
    }

    return Interface;

};

if (typeof exports !== 'undefined'){
    exports.DateTime = HD.DateTime;
}
