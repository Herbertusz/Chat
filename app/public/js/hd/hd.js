/**
 * HD-keret loader
 *
 * @description HD-keret modulok behúzása szerver-oldalra
 * @requires -
 * @example
 * const HD = require('<path>/hd.js')(['utility', 'math', 'datetime.timer']);
 * const timer = HD.DateTime.Timer(-1), id = HD.Number.getUniqueId();
 */

'use strict';

if (typeof module !== 'undefined' && module.exports){
    /**
     * HD-keret moduljainak behúzása
     * @param {Array} modules - modulok fájljainak listája hd.<module>.js alakban
     * @returns {Object} HD névtér
     */
    module.exports = function(modules){
        const loaded = {};
        modules.forEach(function(item){
            Object.assign(loaded, require(`./hd.${item}.js`));
        });
        return loaded;
    };
}
