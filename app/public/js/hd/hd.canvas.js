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

        /**
         * Rétegezés típusa ('layer'|'canvas')
         * @type {String}
         */
        const type = (element instanceof HTMLCanvasElement) ? 'layer' : 'canvas';

        /**
         * Réteg keresése a layerset-ben
         * @private
         * @param {Layer|Canvas} currentLayer - a keresett réteg
         * @returns {Number} a réteg indexe vagy -1
         */
        const getLayerIndex = function(currentLayer){
            return layers.findIndex(function(layer){
                return layer === currentLayer;
            });
        };

        /**
         * A zIndex értékek beállítása a layers tömb sorrendje alapján
         * @private
         */
        const setZIndex = function(){
            let n;
            for (n = 0; n < layers.length; n++){
                layers[n].zIndex = n;
                if (type === 'canvas'){
                    layers[n].getCanvas().style.zIndex = n;
                }
            }
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
             * @param {Number|String} zOverwrite - az új réteg helye (Number|'remain'|'top'|'bg')
             * @returns {Layerset}
             */
            pushLayer : function(currentLayer, zOverwrite){
                if (zOverwrite === 'top'){
                    // legfelső réteg
                    layers.push(currentLayer);
                }
                else if (zOverwrite === 'bg'){
                    // háttérréteg
                    layers.unshift(currentLayer);
                }
                else {
                    // beszúrás a paraméter alapján
                    layers.splice(zOverwrite, 0, currentLayer);
                }
                currentLayer.ownerSet = this;
                setZIndex();
                return this;
            },

            /**
             * Réteg törlése
             * @param {Layer|Canvas} currentLayer - az eltávolítandó réteg
             * @returns {Layerset}
             */
            removeLayer : function(currentLayer){
                const n = getLayerIndex(currentLayer);
                if (n > -1){
                    layers.splice(n, 1);
                    if (type === 'layer'){
                        currentLayer.clear();
                        this.reDraw();
                    }
                    else {
                        const canvasElement = currentLayer.getCanvas();
                        canvasElement.parentNode.removeChild(canvasElement);
                    }
                    setZIndex();
                }
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {Layer|Canvas} currentLayer - a mozdítandó réteg
             * @param {String} direction - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [step=1] - down és up esetében a lépések száma
             * @returns {Layerset}
             */
            moveLayer : function(currentLayer, direction, step = 1){
                const from = getLayerIndex(currentLayer);
                if (from > -1){
                    // réteg áthelyezése a layers tömbben
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
                    setZIndex();

                    if (type === 'layer'){
                        // újrarajzolás
                        this.reDraw();
                    }
                    else {
                        // elemek újrarendezése
                        Array.from(this.element.children)
                            .forEach(function(elem){
                                const thisLayer = layers.find(function(canvas){
                                    return canvas.getCanvas() === elem;
                                });
                                if (thisLayer){
                                    elem.style.zIndex = thisLayer.zIndex;
                                }
                            });
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
        setZIndex();

        return Interface;

    },

    /**
     * Rétegeket kezelő objektum (Module minta)
     * @param {Function} [subCommand] - műveletek
     * @returns {Object}
     */
    Layer : function(subCommand){

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
             * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
             * @type {Number}
             */
            zIndex : 0,

            /**
             * Láthatóság szabályozása
             * @type {Boolean}
             */
            hidden : false,

            /**
             * Minden újrarajzoló művelet előtt végrehajtandó függvény
             * @type {Function}
             */
            subCommand : function(){},

            /**
             * Újrarajzolás
             * @returns {Layer}
             */
            reDraw : function(){
                for (let n = 0; n < drawing.length; n++){
                    this.subCommand();
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

        return Interface;

    },

    /**
     * Canvas elemenet rétegekként kezelő objektum (Module minta)
     * @param {Function} [subCommand] - műveletek
     * @returns {Object}
     */
    Canvas : function(subCommand){

        /**
         * A canvas elem (réteg)
         * @private
         * @type {HTMLCanvasElement}
         */
        const canvas = document.createElement('canvas');

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
             * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
             * @type {Number}
             */
            zIndex : 0,

            /**
             * Láthatóság szabályozása
             * @type {Boolean}
             */
            hidden : false,

            /**
             * Minden újrarajzoló művelet előtt végrehajtandó függvény
             * @type {Function}
             */
            subCommand : function(canvasElement){},

            /**
             * A canvas elem létrehozása
             * @returns {Canvas}
             */
            create : function(){
                if (!canvas.dataset.appended){
                    const container = this.ownerSet.element;
                    container.style.position = 'relative';
                    canvas.style.position = 'absolute';
                    canvas.style.left = 0;
                    canvas.style.top = 0;
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                    container.appendChild(canvas);
                    canvas.dataset.appended = true;
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
                    this.subCommand(canvas);
                    drawing[n].call(this, canvas);
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
                this.subCommand(canvas);
                command.call(this, canvas);
                return this;
            },

            /**
             * Réteg eltüntetése
             * @returns {Canvas}
             */
            hide : function(){
                this.create();
                canvas.style.visibility = 'hidden';
                this.hidden = true;
                this.subCommand(canvas);
                return this;
            },

            /**
             * Réteg megjelenítése
             * @returns {Layer}
             */
            show : function(){
                this.create();
                canvas.style.visibility = 'visible';
                this.hidden = false;
                this.subCommand(canvas);
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @returns {Layer}
             */
            erase : function(){
                this.create();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.subCommand(canvas);
                return this;
            },

            /**
             * Réteg ürítése
             * @returns {Layer}
             */
            clear : function(){
                this.create();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawing = [];
                this.subCommand(canvas);
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

        return Interface;

    }

};

if (typeof exports !== 'undefined'){
    exports.Canvas = HD.Canvas;
}
