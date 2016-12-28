/*!
 * HD-keret Log v1.0.0
 * 2016.07.21.
 */

/* global HD namespace */

'use strict';

var HD = namespace('HD');

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
