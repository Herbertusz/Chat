/**
 * HD-keret Canvas
 *
 * @description Canvas kezelése
 * @requires -
 * @example 2D layer-kezelés: http://canvas.webprog.biz/layer
 */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};

HD.Canvas = {

    /**
     * Canvas 2D alapú alkalmazás inicializálása
     * @param {String} selector - a canvas elem szelektora
     * @returns {Object} alkalmazás
     */
    Context2D : function(selector){
        const App = {};
        App.canvas = document.querySelector(selector);
        App.originalWidth = App.canvas.width;
        App.originalHeight = App.canvas.height;
        App.ctx = App.canvas.getContext('2d');
        return App;
    },

    /**
     * Canvas 3D alapú alkalmazás inicializálása
     * @param {String} selector - a canvas elem szelektora
     * @param {Function} [gameFallbackFunc] - fallback
     * @returns {Object} alkalmazás
     */
    Context3D : function(selector, gameFallbackFunc = () => {}){
        const App = {};

        App.canvas = document.querySelector(selector);
        App.originalWidth = App.canvas.width;
        App.originalHeight = App.canvas.height;
        try {
            App.gl = App.canvas.getContext('webgl') || App.canvas.getContext('experimental-webgl');
        }
        catch (e){}

        if (App.gl){
            return App;
        }
        else {
            gameFallbackFunc.call(App);
        }
    },

    /**
     * Rétegcsoportokat kezelő objektum (Module minta)
     * @param {HTMLCanvasElement} canvas - a canvas elem amelyikhez a layerset tartozik
     * @param {Layer} [layers] - tetszőleges számú réteg
     * @returns {Object}
     */
    Layerset : function(canvas, ...layers){

        /**
         * Réteg keresése a layerset-ben
         * @private
         * @param {Layer} currentLayer - a keresett réteg
         * @returns {Number|Boolean} a réteg indexe vagy false
         */
        const getLayerIndex = function(currentLayer){
            for (let n = 0; n < layers.length; n++){
                if (layers[n] === currentLayer){
                    return n;
                }
            }
            return false;
        };

        /**
         * A zAxis értékek beállítása a zIndex-ek alapján
         * @private
         */
        const resetZAxis = function(){
            let n;
            layers.sort(function(a, b){
                if (a.zIndex === null) a.zIndex = 0;
                if (b.zIndex === null) b.zIndex = 0;
                if (a.zIndex > b.zIndex){
                    return 1;
                }
                if (a.zIndex < b.zIndex){
                    return -1;
                }
                return 0;
            });
            for (n = 0; n < layers.length; n++){
                layers[n].zAxis = n;
            }
        };

        const Interface = {

            /**
             * A canvas elem amelyikhez a layerset tartozik
             * @type {HTMLCanvasElement}
             */
            canvas : canvas,

            /**
             * Réteg beszúrása
             * @param {Layer} currentLayer - az új réteg
             * @param {Number|String} [zOverwrite='remain'] - az új réteg helye (Number|'remain'|'top'|'bg')
             * @returns {Layerset}
             */
            pushLayer : function(currentLayer, zOverwrite = 'remain'){
                if (zOverwrite === 'top'){
                    // legfelső réteg
                    layers.push(currentLayer);
                }
                else if (zOverwrite === 'bg'){
                    // háttérréteg
                    layers.unshift(currentLayer);
                }
                else if (zOverwrite === 'remain'){
                    // beszúrás a benne tárolt zIndex alapján
                    resetZAxis();
                }
                else {
                    // beszúrás a paraméter alapján
                    layers.splice(zOverwrite, 0, currentLayer);
                }
                currentLayer.ownerSet = this;
                return this;
            },

            /**
             * Réteg törlése
             * @param {Layer} currentLayer - az eltávolítandó réteg
             * @returns {Layerset}
             */
            removeLayer : function(currentLayer){
                const n = getLayerIndex(currentLayer);
                if (n !== false){
                    layers.splice(n, 1);
                    currentLayer.clear();
                    this.reDraw();
                }
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {Layer} currentLayer - a mozdítandó réteg
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @returns {Layerset}
             */
            moveLayer : function(currentLayer, location, num = 1){
                let temp, i;
                const max = layers.length - 1;
                let n = getLayerIndex(currentLayer);
                if (n !== false){
                    if (location === 'up'){
                        for (i = 0; n < max && i < num; n++, i++){
                            temp = layers[n + 1];
                            layers[n + 1] = layers[n];
                            layers[n] = temp;
                        }
                    }
                    else if (location === 'down'){
                        for (i = 0; n > 0 && i < num; n--, i++){
                            temp = layers[n - 1];
                            layers[n - 1] = layers[n];
                            layers[n] = temp;
                        }
                    }
                    else if (location === 'top'){
                        for (; n < max; n++){
                            temp = layers[n + 1];
                            layers[n + 1] = layers[n];
                            layers[n] = temp;
                        }
                    }
                    else if (location === 'bg' && n > 0){
                        for (; n > 0; n--){
                            temp = layers[n - 1];
                            layers[n - 1] = layers[n];
                            layers[n] = temp;
                        }
                    }
                    this.reDraw();
                }
                return this;
            },

            /**
             * Újrarajzolás
             * @param {Array.<Layer>} [except=[]] - ezeket a rétegeket nem rajzolja újra
             * @returns {Layerset}
             */
            reDraw : function(except = []){
                let n;
                resetZAxis();
                for (n = 0; n < layers.length; n++){
                    // FIXME: indexOf argumentuma egy objektum!
                    if (except.indexOf(layers[n]) === -1 && !layers[n].hidden){
                        layers[n].reDraw();
                    }
                }
                return this;
            }

        };

        layers.forEach(function(layer, i){
            layer.ownerSet = Interface;
        });
        resetZAxis();

        return Interface;

    },

    /**
     * Rétegeket kezelő objektum (Module minta)
     * @param {Function} [subCommand] - műveletek
     * @param {Number} [z] - előírt zIndex érték (különben a Layerset-ben megadott sorrend határozza meg)
     * @returns {Object}
     */
    Layer : function(subCommand, z){

        /**
         * Az eddigi műveletek tárolása
         * @private
         * @type {Array.<Function>}
         */
        let drawing = [];

        const Interface = {

            /**
             * A Layerset amelyikhez a réteg tartozik
             * @private
             * @type {Layerset}
             */
            ownerSet : null,

            /**
             * Kívánt pozíció a z-tengelyen
             * @private
             * @type {Number}
             */
            zIndex : null,

            /**
             * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
             * @type {Number}
             */
            zAxis : 0,

            /**
             * Láthatóság szabályozása
             * @type {Boolean}
             */
            hidden : false,

            /**
             * Minden újrarajzoló művelet előtt végrehajtandó függvény
             * @type {Function}
             */
            subCommand : function(){
            },

            /**
             * Újrarajzolás
             * @returns {Layer}
             */
            reDraw : function(){
                for (let n = 0; n < drawing.length; n++){
                    this.subCommand(this);
                    drawing[n].call(this);
                }
                return this;
            },

            /**
             * Művelet beszúrása a sorba
             * @param {Function} command - műveletek
             * @returns {Layer}
             */
            push : function(command){
                drawing.push(command);
                return this;
            },

            /**
             * Művelet beszúrása és végrehajtása
             * @param {Function} command - műveletek
             * @returns {Layer}
             */
            draw : function(command){
                drawing.push(command);
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg eltüntetése
             * @returns {Layer}
             */
            hide : function(){
                const canvas = this.ownerSet.canvas;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.hidden = true;
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg megjelenítése
             * @returns {Layer}
             */
            show : function(){
                this.hidden = false;
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @returns {Layer}
             */
            erase : function(){
                const canvas = this.ownerSet.canvas;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg ürítése
             * @returns {Layer}
             */
            clear : function(){
                const canvas = this.ownerSet.canvas;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawing = [];
                this.ownerSet.reDraw();
                return this;
            },

            /**
             * Réteg törlése
             * @returns {Layer}
             */
            remove : function(){
                this.ownerSet.removeLayer(this);
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @returns {Layer}
             */
            move : function(location, num){
                this.ownerSet.moveLayer(this, location, num);
                return this;
            }

        };

        if (typeof subCommand === 'function'){
            Interface.subCommand = subCommand;
        }
        if (typeof z !== 'undefined'){
            Interface.zIndex = z;
        }

        return Interface;

    }

};

if (typeof exports !== 'undefined'){
    exports.Canvas = HD.Canvas;
}
