/**
 * HD-keret Canvas
 *
 * @description Canvas kezelése
 * @requires -
 * @example 2D layer-kezelés: http://blog.web-prog.hu/public/layer/layertest.html
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
     * @param {HTMLElement|null} element - az elem amelyikhez a layerset tartozik
     * @param {Layer|Level} [layers] - tetszőleges számú réteg
     * @returns {Object}
     */
    Layerset : function(element, ...layers){

        /**
         * Rétegezés típusa ('layer'|'level')
         * @type {String}
         */
        const type = (typeof element === 'object' && element instanceof HTMLCanvasElement) ? 'layer' : 'level';

        /**
         * Réteg keresése a layerset-ben
         * @private
         * @param {Layer|Level} currentLayer - a keresett réteg
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
                if (type === 'level'){
                    layers[n].getCanvas().style.zIndex = n;
                }
            }
        };

        /**
         * Inicializálás
         * @param {Array} _layers - a konstruktornak átadott rétegek
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_layers, _Interface){
            _layers.forEach(function(layer, i){
                layer.ownerSet = _Interface;
            });
            setZIndex();
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
             * @param {Layer|Level} currentLayer - az új réteg
             * @param {Number|String} zIndex - az új réteg helye (Number|'top'|'bg')
             * @returns {Layerset}
             */
            pushLayer : function(currentLayer, zIndex){
                if (zIndex === 'top'){
                    // legfelső réteg
                    layers.push(currentLayer);
                }
                else if (zIndex === 'bg'){
                    // háttérréteg
                    layers.unshift(currentLayer);
                }
                else {
                    // beszúrás a paraméter alapján
                    layers.splice(zIndex, 0, currentLayer);
                }
                currentLayer.ownerSet = this;
                setZIndex();
                return this;
            },

            /**
             * Réteg törlése
             * @param {Layer|Level} currentLayer - az eltávolítandó réteg
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
             * @param {Layer|Level} currentLayer - a mozdítandó réteg
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
                }
                return this;
            },

            /**
             * Újrarajzolás
             * @param {Array.<Layer|Level>} [except=[]] - ezeket a rétegeket nem rajzolja újra
             * @returns {Layerset}
             */
            reDraw : function(except = []){
                let n;
                if (type === 'layer'){
                    const canvas = this.element;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                for (n = 0; n < layers.length; n++){
                    // FIXME: indexOf argumentuma egy objektum!
                    if (except.indexOf(layers[n]) === -1 && !layers[n].hidden){
                        layers[n].reDraw();
                    }
                }
                return this;
            }

        };

        init(layers, Interface);

        return Interface;

    },

    /**
     * Rétegeket kezelő objektum (Module minta)
     * @param {Function} [subCommand=function(){}] - minden újrarajzoló művelet előtt végrehajtandó függvény
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
         * Inicializálás
         * @param {Function} _subCommand - a konstruktornak átadott argumentum
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_subCommand, _Interface){
            if (typeof _subCommand === 'function'){
                _Interface.subCommand = _subCommand;
            }
        };

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

        init(subCommand, Interface);

        return Interface;

    },

    /**
     * Canvas elemeket rétegekként kezelő objektum (Module minta)
	 * @param {HTMLCanvasElement|String|Function} [args]
	 *  {HTMLCanvasElement} [predefinedCanvas=null] - saját canvas
	 *  {String} [ctxType=null] - alapértelmezett rajzoló kontextus ('2d'|'webgl'|...)
     *  {Function} [subCommand=function(){}] - minden újrarajzoló művelet előtt végrehajtandó függvény
     * @returns {Object}
     */
    Level : function(...args){

        /**
         * A canvas elem (réteg)
         * @private
         * @type {HTMLCanvasElement}
         */
        let canvas = null;

        /**
         * Rajzoló kontextus
         * @private
         * @type {Object}
         */
        let defaultCtx = null;

        /**
         * Az eddigi műveletek tárolása
         * @private
         * @type {Array.<Function>}
         */
        let drawing = [];

        /**
         * Inicializálás
         * @param {Array} _args - a konstruktornak átadott argumentumok
         * @param {Object} _Interface - a konstruktor által visszaadott felület
         */
        const init = function(_args, _Interface){
            // argumentumok kezelése
            let predefinedCanvas = null;
            let ctxType = null;
            let subCommand = function(){};
            _args.forEach(function(arg){
                if (typeof arg === 'object'){
                    predefinedCanvas = arg;
                }
                else if (typeof arg === 'string'){
                    ctxType = arg;
                }
                else if (typeof arg === 'function'){
                    subCommand = arg;
                }
            });

			// inicializálás
            if (predefinedCanvas !== null && predefinedCanvas instanceof HTMLCanvasElement){
                canvas = predefinedCanvas;
                canvas.dataset.appended = true;
            }
            else {
                canvas = document.createElement('canvas');
            }
            if (ctxType !== null){
                defaultCtx = canvas.getContext(ctxType);
            }
            _Interface.subCommand = subCommand;
        };

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
            subCommand : function(canvasElement, ctx){},

            /**
             * A canvas elem létrehozása
             * @returns {Level}
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
             * @returns {Level}
             */
            reDraw : function(){
                this.create();
                for (let n = 0; n < drawing.length; n++){
                    this.subCommand(canvas, defaultCtx);
                    drawing[n].call(this, canvas, defaultCtx);
                }
                return this;
            },

            /**
             * Művelet beszúrása a sorba
             * @param {Function} command - műveletek
             * @returns {Level}
             */
            push : function(command){
                drawing.push(command);
                return this;
            },

            /**
             * Művelet beszúrása és végrehajtása
             * @param {Function} command - műveletek
             * @returns {Level}
             */
            draw : function(command){
                this.create();
                drawing.push(command);
                this.subCommand(canvas, defaultCtx);
                command.call(this, canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg eltüntetése
             * @returns {Level}
             */
            hide : function(){
                this.create();
                canvas.style.visibility = 'hidden';
                this.hidden = true;
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg megjelenítése
             * @returns {Level}
             */
            show : function(){
                this.create();
                canvas.style.visibility = 'visible';
                this.hidden = false;
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg leradírozása (ürítés, a drawing sor megmarad)
             * @returns {Level}
             */
            erase : function(){
                this.create();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg ürítése
             * @returns {Level}
             */
            clear : function(){
                this.create();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawing = [];
                this.subCommand(canvas, defaultCtx);
                return this;
            },

            /**
             * Réteg törlése
             * @returns {Level}
             */
            remove : function(){
                this.ownerSet.removeLayer(this);
                return this;
            },

            /**
             * Réteg mozgatása a z-tengelyen
             * @param {String} location - mozgatás iránya ('down'|'up'|'bg'|'top')
             * @param {Number} [num=1] - down és up esetében a lépések száma
             * @returns {Level}
             */
            move : function(location, num){
                this.ownerSet.moveLayer(this, location, num);
                return this;
            }

        };

        init(args, Interface);

        return Interface;

    }

};

if (typeof exports !== 'undefined'){
    exports.Canvas = HD.Canvas;
}
