/*!
 * HD-keret Math v1.0.0
 * 2015.02.21.
 */

/* global HD */

"use strict";

var HD = global.HD || {};

/**
 * Matematikai műveletek (Math objektum kiegészítései)
 * @type {Object}
 */
HD.Math = {

    /**
     * Véletlenszám a és b között
     * @param {Number} min egész szám
     * @param {Number} max egész szám
     * @returns {Number} egész szám
     */
    rand : function(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Tizes számrendszerbeli kerekítés
     * @param {String} type kjerekítés típusa
     * @param {*} value szám
     * @param {Number} [exp=0] exponens (...|-2|-1|0|1|2|...) (a kerekítési alap 10-es alapú logaritmusa)
     * @returns {Number} kerekített érték
     */
    _decimalAdjust : function(type, value, exp){
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0){
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)){
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    },

    /**
     * Szám kerekítése
     * @param {Number} value szám
     * @param {Number} [exp=0] pontosság (helyiérték csúsztatása)
     * @returns {Number} kerekített érték
     */
    round : function(value, exp){
        return HD.Math._decimalAdjust('round', value, exp);
    },
    /**
     * Szám lefelé kerekítése
     * @param {Number} value szám
     * @param {Number} [exp=0] pontosság (helyiérték csúsztatása)
     * @returns {Number} kerekített érték
     */
    floor : function(value, exp){
        return HD.Math._decimalAdjust('floor', value, exp);
    },
    /**
     * Szám felfelé kerekítése
     * @param {Number} value szám
     * @param {Number} [exp=0] pontosság (helyiérték csúsztatása)
     * @returns {Number} kerekített érték
     */
    ceil : function(value, exp){
        return HD.Math._decimalAdjust('ceil', value, exp);
    },

    /**
     * Halmazműveletek
     * @type {Object}
     */
    Set : {

        /**
         * Unió
         * @param {Array} A
         * @param {Array} B
         * @returns {Array} A|B
         */
        union : function(A, B){
            let n;
            const ret = A;
            for (n = 0; n < B.length; n++){
                if (ret.indexOf(B[n]) === -1){
                    ret.push(B[n]);
                }
            }
            return ret;
        },

        /**
         * Metszet
         * @param {Array} A
         * @param {Array} B
         * @returns {Array} A&B
         */
        intersection : function(A, B){
            let n;
            const ret = [];
            for (n = 0; n < A.length; n++){
                if (B.indexOf(A[n]) > -1){
                    ret.push(A[n]);
                }
            }
            return ret;
        },

        /**
         * Különbség
         * @param {Array} A
         * @param {Array} B
         * @returns {Array} A\B
         */
        difference : function(A, B){
            let n;
            const ret = [];
            for (n = 0; n < A.length; n++){
                if (B.indexOf(A[n]) === -1){
                    ret.push(A[n]);
                }
            }
            return ret;
        },

        /**
         * Egyenlőség
         * @param {Array} A
         * @param {Array} B
         * @returns {Boolean} A === B sorrendtől eltekintve
         */
        equal : function(A, B){
            let i;
            if (A === B) return true;
            if (A.length !== B.length) return false;
            A.sort();
            B.sort();
            for (i = 0; i < A.length; ++i){
                if (A[i] !== B[i]) return false;
            }
            return true;
        }

    },

    /**
     * Geometriai műveletek
     * @type {Object}
     */
    Geometry : {

        /**
         * Két pont távolsága
         * @param {Object} a pont {x : Number, y : Number}
         * @param {Object} b pont {x : Number, y : Number}
         * @returns {Number} távolság
         */
        distance : function(a, b){
            return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        },

        /**
         * Abszolút koordináták kiszámítása (csomópontok, korongok, stb)
         * @param {Array} positions relatív koordináták [[Number, Number], ...]
         * @param {Number} w abszolút szélesség
         * @param {Number} h abszolút magasság
         * @param {Number} [xOffset=0] abszolút vízszintes eltolás
         * @param {Number} [yOffset=0] abszolút függőleges eltolás
         * @returns {Array} abszolút koordináták [{x : Number, y : Number}, ...]
         */
        getAbsoluteCoords : function(positions, w, h, xOffset, yOffset){
            let x, y;
            const coords = [];
            if (typeof xOffset === "undefined") xOffset = 0;
            if (typeof yOffset === "undefined") yOffset = 0;
            positions.forEach(function(elem, index){
                x = elem[0] / 100;
                y = elem[1] / 100;
                coords[index] = {
                    x : Math.round(w * x) + xOffset,
                    y : Math.round(h * y) + yOffset
                };
            });
            return coords;
        },

        /**
         * Pont benne van-e egy téglalapban
         * @param {Object} point {x : Number, y : Number}
         * @param {Object} rectangle {x : Number, y : Number, w : Number, h : Number}
         * @returns {Boolean}
         */
        isPointInsideRectangle : function(point, rectangle){
            return (rectangle.x < point.x && rectangle.x + rectangle.w > point.x &&
            rectangle.y < point.y && rectangle.y + rectangle.h > point.y);
        }

    },

    /**
     * Általános animáció futtató
     * @param {Function} func minden lépésnél meghívott függvény (megkapja az animáció értékét)
     * @param {Function} callback az animáció végén meghívott függvény
     * @param {Number} delay animáció hossza (ms)
     * @param {Number} [range=1] maximális animációs érték
     * @param {String} [easing="swing"] animációs függvény
     */
    animate : function(func, callback, delay, range, easing){
        let i, len;
        let value = 0;
        const steps = delay / 20;
        if (typeof range === "undefined") range = 1;
        if (typeof easing === "undefined") easing = "swing";

        const Easings = {
            /**
             * Easing függvény (továbbiak: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js)
             * @param {Number} t független változó (idő)
             * @param {Number} b kezdeti érték y(t0)
             * @param {Number} c érték változása y(t1) - y(t0)
             * @param {Number} d időtartam (t1 - t0)
             * @returns {Number} függvény értéke y(t)
             */
            linear : function(t, b, c, d){
                return c * t / d + b;
            },
            swing : function(t, b, c, d){
                return ((-Math.cos(t * Math.PI / d) / 2) + 0.5) * c + b;
            }
        };

        // TODO: felül kell vizsgálni ezt a szerkezetet
        for (i = 0, len = Math.floor(steps); i <= len; i++){
            value = Easings[easing](i, 0, range, steps);
            (function(val, currentStep){
                window.setTimeout(function(){
                    func.call(this, val);
                    if (currentStep === len && typeof callback === "function"){
                        callback.call(this);
                    }
                }.bind(this), delay / steps * i);
            })(value, i);
        }
    }

};

exports.Math = HD.Math;
