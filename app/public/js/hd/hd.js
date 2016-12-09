/*!
 * HD-keret Core v1.0.0
 * 2015.02.21.
 *
 * @requires jQuery
 */

'use strict';

/**
 * Globális HD névtér
 * @namespace HD
 */
var HD = window.HD || {};

/**
 * Névtér definiálás (nested namespace minta)
 * @param {String} namespaceString
 * @returns {Object}
 */
var namespace = function(namespaceString){
    let i, length;
    let parent = window;
    let currentPart = '';
    const parts = namespaceString.split('.');

    for (i = 0, length = parts.length; i < length; i++){
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }

    return parent;
};

// /**
//  * jQuery data attribútum szelektor :data(név,érték)
//  * @param {HTMLElement} obj aktuális DOM elem
//  * @param {Number} index
//  * @param {Array} meta szelektor adatai
//  * @returns {Boolean} true, ha a szelektorra illeszkedik az aktuális DOM elem
//  */
// $.expr[':'].data = function(obj, index, meta){
//     const args = meta[3].split(',');
//     if (args.length === 1){
//         return (typeof $(obj).data($.trim(args[0])) !== 'undefined');
//     }
//     else if (args.length === 2){
//         return ($(obj).data($.trim(args[0])) == $.trim(args[1]));
//     }
//     else {
//         return false;
//     }
// };

/**
 * Webalkalmazás funkcióinak vezérlése (Module minta)
 * @returns {Object} webalkalmazás-vezérlő felület
 */
HD.Web = function(){

    let i;
    const documentReady = [];
    const windowLoad = [];

    return {

        pushReady : function(func){
            documentReady.push(func);
        },

        pushLoad : function(func){
            windowLoad.push(func);
        },

        init : function(){
            document.addEventListener('DOMContentLoaded', function(){
                for (i = 0; i < documentReady.length; i++){
                    documentReady[i].call(HD.Web);
                }
            });
            window.addEventListener('load', function(){
                for (i = 0; i < windowLoad.length; i++){
                    windowLoad[i].call(HD.Web);
                }
            });
        }

    };

};
