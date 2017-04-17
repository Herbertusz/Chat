/**
 * HD-keret Log
 *
 * @description Kliens-oldalról érkező hibák logolása
 * @requires HD.DOM
 */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};

/**
 * Kliens oldali logolás
 * @type {Object}
 */
HD.Log = {

    /**
     * Hiba fájlba írása
     * @param {Error} data
     */
    error : function(data){
        const errorName = encodeURIComponent(data.name);
        const errorMessage = encodeURIComponent(data.message);
        const errorStack = encodeURIComponent(data.stack);

        HD.DOM.ajax({
            method : 'POST',
            url : '/chat/clientlog',
            data : `name=${errorName}&message=${errorMessage}&stack=${errorStack}`
        });
    }

};

if (typeof exports !== 'undefined'){
    exports.Log = HD.Log;
}
