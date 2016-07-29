/*!
 * HD-keret Log v1.0.0
 * 2016.07.21.
 */

/* global HD namespace */

"use strict";

var HD = namespace("HD");

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
        const xhr = new XMLHttpRequest();
        const errorName = encodeURIComponent(data.name);
        const errorMessage = encodeURIComponent(data.message);
        const errorStack = encodeURIComponent(data.stack);
        const postData = `name=${errorName}&message=${errorMessage}&stack=${errorStack}`;

        xhr.open("POST", "/chat/clientlog");
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(postData);
    }

};
