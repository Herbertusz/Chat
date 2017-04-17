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
     * @param {HTMLElement} element - az elem amelyikhez a layerset tartozik
     * @param {Layer|Canvas} [layers] - tetszőleges számú réteg
     * @returns {Object}
     */
    Layerset : function(element, ...layers){

        const type = (element instanceof HTMLCanvasElement) ? 'layer' : 'canvas';

        /**
         * Réteg keresése a layerset-ben
         * @private
         * @param {Layer|Canvas} currentLayer - a keresett réteg
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
                layers[n].zIndex = null;
                layers[n].zAxis = n;
            }
        };

        /**
         * Réteg áthelyezése a layers tömbben
         * @param {Number} from - a mozdítandó réteg sorszáma
         * @param {String} direction - mozgatás iránya ('down'|'up'|'bg'|'top')
         * @param {Number} step - down és up esetében a lépések száma
         */
        const changeZAxis = function(from, direction, step){
            const max = layers.length - 1;
            let to;
            if (direction === 'up'){
                to = Math.min(from + step, max);
            }
            else if (direction === 'down'){
                to = Math.max(from - step, 0);
            }
            else if (direction === 'top'){
                to = max;
            }
            else if (direction === 'bg'){
                to = 0;
            }
            layers.splice(to, 0, layers.splice(from, 1)[0]);
            resetZAxis();
        };

        /**
         * API
         * @type {Object}
         */
        const Interface = {

            /**
             * A DOM elem amelyikhez a layerset tartozik
             * @type {HTMLElement}
             */
            element : element,

            /**
             * Réteg beszúrása
             * @param {Layer|Canvas} currentLayer - az új réteg
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
             * @param {Layer|Canvas} currentLayer - az eltávolítandó réteg
             * @returns {Layerset}
             */
            removeLayer : function(currentLayer){
                const n = getLayerIndex(currentLayer);
                if (n !== false){
                    layers.splice(n, 1);
                    if (type === 'layer'){
                        currentLayer.clear();
                        this.reDraw();
                    }
                    else {
                        currentLayer.parentNode.removeChild(currentLayer);
                    }
                }
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {Layer|Canvas} currentLayer - a mozdítandó réteg
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @returns {Layerset}
             */
            moveLayer : function(currentLayer, location, num = 1){
                const n = getLayerIndex(currentLayer);
                if (n !== false){
                    changeZAxis(n, location, num);
                    if (type === 'layer'){
                        this.reDraw();
                    }
                    else {
                        const unsortedLayers = [];
                        const chArr = Array.from(this.element.children);
                        let i;
                        chArr.forEach(function(elem){
                            unsortedLayers.push(elem.parentNode.removeChild(elem));
                        });
                        layers.forEach(function(layer){
                            ;
                        });
                        this.element.appendChild();
                    }
                }
                return this;
            },

            /**
             * Újrarajzolás
             * @param {Array.<Layer|Canvas>} [except=[]] - ezeket a rétegeket nem rajzolja újra
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

        /**
         * API
         * @type {Object}
         */
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
                const canvas = this.ownerSet.element;
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
                const canvas = this.ownerSet.element;
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
                const canvas = this.ownerSet.element;
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

    },

    /**
     * Canvas elemenet rétegekként kezelő objektum (Module minta)
     * @param {Function} [subCommand] - műveletek
     * @param {Number} [z] - előírt zIndex érték (különben a Layerset-ben megadott sorrend határozza meg)
     * @returns {Object}
     */
    Canvas : function(subCommand, z){

        /**
         * A canvas elem (réteg)
         * @private
         * @type {HTMLCanvasElement}
         */
        let canvas = null;

        /**
         * Az eddigi műveletek tárolása
         * @private
         * @type {Array.<Function>}
         */
        let drawing = [];

        /**
         * API
         * @type {Object}
         */
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
            subCommand : function(ctx){
            },

            /**
             * A canvas elem létrehozása
             * @returns {Canvas}
             */
            create : function(){
                if (!canvas){
                    const container = this.ownerSet.element;
                    canvas = document.createElement('canvas');
                    container.style.position = 'relative';
                    canvas.style.position = 'absolute';
                    canvas.style.left = 0;
                    canvas.style.top = 0;
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                    container.appendChild(canvas);
                }
                return this;
            },

            /**
             * A canvas elem ami a réteget alkotja
             * @returns {HTMLCanvasElement}
             */
            getCanvas : function(){
                this.create();
                return canvas;
            },

            /**
             * Újrarajzolás
             * @returns {Canvas}
             */
            reDraw : function(){
                this.create();
                for (let n = 0; n < drawing.length; n++){
                    this.subCommand(this);
                    drawing[n].call(this);
                }
                return this;
            },

            /**
             * Művelet beszúrása a sorba
             * @param {Function} command - műveletek
             * @returns {Canvas}
             */
            push : function(command){
                drawing.push(command);
                return this;
            },

            /**
             * Művelet beszúrása és végrehajtása
             * @param {Function} command - műveletek
             * @returns {Canvas}
             */
            draw : function(command){
                this.create();
                drawing.push(command);
                return this;
            },

            /**
             * Réteg eltüntetése
             * @returns {Canvas}
             */
            hide : function(){
                canvas.style.visibility = 'hidden';
                this.hidden = true;
                return this;
            },

            /**
             * Réteg megjelenítése
             * @returns {Layer}
             */
            show : function(){
                canvas.style.visibility = 'visible';
                this.hidden = false;
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @returns {Layer}
             */
            erase : function(){
                const canvas = this.ownerSet.element;
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
                const canvas = this.ownerSet.element;
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
