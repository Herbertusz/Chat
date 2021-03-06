/**
 * HD-keret DOM
 *
 * @description DOM-kezelő
 * @requires HD.Misc.switching
 * @example
 *  HD.DOM('.class').event('click', function(target, event){...});
 *  HD.DOM('.class').descendants('button').data('clickable', 'true').trigger('click');
 *  const cloneElement = HD.DOM('.class').filter('[data-disabled]').clone(true).elem();
 */

'use strict';

var HD = (typeof global !== 'undefined' ? global.HD : window.HD) || {};
if (typeof global !== 'undefined'){
    HD = require('./hd.js')(['utility']);
}

/**
 * DOM elemek kezelését segítő objektum (Module minta)
 * @param {String|Array|HTMLElement|NodeList} identifier
 * @returns {Object}
 */
HD.DOM = function(identifier){

    /**
     *
     * @param {Object} ident
     * @returns {Boolean}
     */
    const acceptableObject = function(ident){
        if (typeof ident === 'object'){
            if (
                typeof ident.nodeType === 'number' &&
                (ident.nodeType === Node.ELEMENT_NODE || ident.nodeType === Node.DOCUMENT_NODE)
            ){
                // HTMLElement | document
                return true;
            }
            else if (typeof ident.self !== 'undefined' && ident.self === ident){
                // window
                return true;
            }
        }
    };

    /**
     * Egy elemhez csatolt eseménykezelők
     * @param {HTMLElement} element
     * @param {String} [eventName]
     * @returns {Array.<Object>}
     * @private
     */
    const getHandlers = function(element, eventName){
        if (typeof eventName === 'string'){
            return HD.DOM.eventListeners.filter(function(listener){
                return listener.target === element && listener.eventName === eventName;
            });
        }
        else {
            return HD.DOM.eventListeners.filter(function(listener){
                return listener.target === element;
            });
        }
    };

    /**
     * Egy elemhez csatolt adatok
     * @param {HTMLElement} element
     * @param {String} [name]
     * @returns {Object|Array.<Object>}
     * @private
     */
    const getDataObjects = function(element, name){
        if (typeof name === 'string'){
            return HD.DOM.dataObjects.find(function(data){
                return data.element === element && data.name === name;
            });
        }
        else {
            return HD.DOM.dataObjects.filter(function(data){
                return data.element === element;
            });
        }
    };

    /**
     * Element.matches polyfill
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {Boolean}
     * @private
     */
    const matches = function(element, selector){
        const p = Element.prototype;
        const f = p.matches ||
            p.webkitMatchesSelector ||
            p.mozMatchesSelector ||
            p.msMatchesSelector ||
            p.oMatchesSelector;
        return f.call(element, selector);
    };

    return {

        /**
         * A kiválasztott elemek tárolása
         * @type {Array.<HTMLElement>}
         */
        elements : (function(ident){
            if (typeof ident === 'string'){
                if (ident.indexOf('<') > -1){
                    // HTML kód
                    const div = document.createElement('div');
                    div.innerHTML = ident;
                    return [...div.children];
                }
                else {
                    // Szelektor
                    return [...document.querySelectorAll(ident)];
                }
            }
            else if (typeof ident === 'object'){
                if (ident instanceof Array){
                    // Tömb
                    const accept = ident.every(function(elem){
                        return acceptableObject(elem);
                    });
                    if (accept){
                        return ident;
                    }
                    else {
                        throw Error('HD.DOM(): Nem támogatott objektum típusok találhatók a tömbben.');
                    }
                }
                else if (ident instanceof NodeList || ident instanceof HTMLCollection){
                    // Elemlista
                    return [...ident];
                }
                else if (ident === null){
                    return [];
                }
                else if (acceptableObject(ident)){
                    return [ident];
                }
                else {
                    throw Error('HD.DOM(): Nem támogatott objektum típus.');
                }
            }
            else {
                throw Error('HD.DOM(): Nem támogatott típus.');
            }
        })(identifier),

        /**
         * Első elem lekérése
         * @returns {HTMLElement|null}
         */
        elem : function(){
            if (typeof this.elements[0] !== 'undefined'){
                return this.elements[0];
            }
            else {
                return null;
            }
        },

        /**
         * Keresés a leszármazott elemek közt
         * @param {String} selector
         * @returns {Object}
         */
        descendants : function(selector){
            let elements = [];

            this.elements.forEach(function(elem){
                elements = elements.concat([...elem.querySelectorAll(selector)]);
            });
            return HD.DOM(elements);
        },

        /**
         * Keresés a szülő elemek közt
         * @param {String} selector
         * @returns {Object}
         */
        ancestors : function(selector){
            const elements = [];
            let parent = this.elem().parentNode;

            while (parent.nodeType !== Node.DOCUMENT_NODE){
                if (matches(parent, selector)){
                    elements.push(parent);
                }
                parent = parent.parentNode;
            }
            return HD.DOM(elements);
        },

        /**
         * Keresés a környező elemek közt
         * @param {String} ancestorSelector
         * @param {String} descendantSelector
         * @returns {Object}
         */
        neighbours : function(ancestorSelector, descendantSelector){
            return this.ancestors(ancestorSelector).descendants(descendantSelector);
        },

        /**
         * Elemek szűrése
         * @param {String} selector
         * @returns {Object}
         */
        filter : function(selector){
            const elements = this.elements.filter(function(elem){
                return matches(elem, selector);
            });
            return HD.DOM(elements);
        },

        /**
         * Elemek szűrése kapcsolt adat alapján
         * @param {String} name
         * @param {*} [value]
         * @returns {Object}
         */
        getByData : function(name, value){
            let elements;

            if (typeof value === 'undefined'){
                elements = this.filter(`[data-${name}]`);
            }
            else {
                elements = this.filter(`[data-${name}="${value}"]`);
            }
            return elements;
        },

        /**
         * Elemhez kapcsolt adat lekérdezése / módosítása
         * @param {String} name
         * @param {String} [value]
         * @returns {String|HD.DOM}
         */
        data : function(name, value){
            if (typeof value === 'undefined'){
                // getter
                if (this.elem().hasAttribute(`data-${name}`)){
                    return this.elem().getAttribute(`data-${name}`);
                }
                else {
                    return null;
                }
            }
            else {
                // setter
                this.elements.forEach(function(elem){
                    elem.setAttribute(`data-${name}`, value);
                });
                return this;
            }
        },

        /**
         * Elemhez kapcsolt adat törlése
         * @param {String} name
         * @returns {HD.DOM}
         */
        removeData : function(name){
            // setter
            this.elements.forEach(function(elem){
                elem.removeAttribute(`data-${name}`);
            });
            return this;
        },

        /**
         * Elemhez kapcsolt logikai adat lekérdezése / módosítása
         * @param {String} name
         * @param {Boolean} [value]
         * @returns {Boolean|HD.DOM}
         */
        dataBool : function(name, value){
            if (typeof value === 'undefined'){
                // getter
                const data = this.data(name);
                return !(
                    data === null ||
                    data === '' ||
                    data === '0' ||
                    data === 'false' ||
                    data === 'null' ||
                    data === 'undefined'
                );
            }
            else {
                // setter
                if (value){
                    this.data(name, 'true');
                }
                else {
                    this.removeData(name);
                }
                return this;
            }
        },

        /**
         * Elemhez kapcsolt szám adat lekérdezése / módosítása
         * @param {String} name
         * @param {Number} [value]
         * @returns {Number|HD.DOM}
         */
        dataNum : function(name, value){
            if (typeof value === 'undefined'){
                // getter
                const data = this.data(name);
                return Number(data);
            }
            else {
                // setter
                this.data(name, value.toString());
                return this;
            }
        },

        /**
         * Elemhez kapcsolt objektum adat lekérdezése / módosítása
         * @param {String} name
         * @param {Object} [value]
         * @returns {Object|HD.DOM}
         */
        dataObj : function(name, value){
            if (typeof value === 'undefined'){
                // getter
                let obj;
                const data = this.data(name);

                try {
                    obj = JSON.parse(data);
                }
                catch (error){
                    if (!data){
                        obj = {};
                    }
                    else {
                        throw error;
                    }
                }
                return obj;
            }
            else {
                // setter
                this.data(name, JSON.stringify(value));
                return this;
            }
        },

        /**
         * Elemhez kapcsolt adat lekérdezése / módosítása
         * @param {String} name
         * @param {*} [value]
         * @returns {*|HD.DOM}
         */
        dataX : function(name, value){
            if (typeof value === 'undefined'){
                // getter
                const element = this.elem();
                const data = getDataObjects(element, name);

                if (element.hasAttribute(`data-${name}`)){
                    value = element.getAttribute(`data-${name}`);
                    if (data){
                        value = HD.Misc.switching(data.type, {
                            'undefined' : null,
                            'boolean' : Boolean(value),
                            'number' : Number(value),
                            'string' : String(value),
                            'symbol' : Symbol(value),
                            'object' : JSON.parse(value)
                        }, value);
                        if (data.value === null){
                            value = null;
                        }
                    }
                    return value;
                }
                else {
                    return null;
                }
            }
            else {
                // setter
                const originalType = typeof value;
                let storeValue;

                if (originalType === 'undefined' || value === null){
                    storeValue = null;
                }
                else if (originalType === 'object'){
                    storeValue = JSON.stringify(value);
                }
                else {
                    storeValue = value.toString();
                }
                this.elements.forEach(function(elem){
                    HD.DOM.dataObjects.push({
                        element : elem,
                        type : originalType,
                        name : name,
                        value : value
                    });
                    elem.setAttribute(`data-${name}`, storeValue);
                });
                return this;
            }
        },

        /**
         * Elem tulajdonságának lekérdezése / módosítása
         * @param {String} property
         * @param {Boolean} value
         * @returns {Boolean|HD.DOM}
         */
        prop : function(property, value){
            if (typeof value === 'undefined'){
                // getter
                return this.elem()[property];
            }
            else {
                // setter
                this.elements.forEach(function(elem){
                    elem[property] = value;
                });
                return this;
            }
        },

        /**
         * Osztálylista módosítása
         * @param {String} operation - 'add'|'remove'|'toggle'
         * @param {String} classNames
         * @returns {HD.DOM}
         */
        class : function(operation, ...classNames){
            this.elements.forEach(function(elem){
                elem.classList[operation](...classNames);
            });
            return this;
        },

        /**
         * CSS-tulajdonságok lekérdezése / módosítása
         * @param {String|Object} properties
         * @returns {String|HD.DOM}
         */
        css : function(properties){
            if (typeof properties === 'string'){
                // getter
                return window.getComputedStyle(this.elem()).getPropertyValue(properties);
            }
            else {
                // setter
                this.elements.forEach(function(elem){
                    let prop;
                    for (prop in properties){
                        prop = prop.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
                        elem.style[prop] = properties[prop];
                    }
                });
                return this;
            }
        },

        /**
         * Elem klónozása
         * @param {Boolean} [withEvents=false] - eseménykezelők másolása
         * @returns {Object}
         */
        clone : function(withEvents = false){
            const elementClone = this.elem().cloneNode(true);

            if (withEvents){
                let elem, elemClone, listeners;
                const iterator = document.createNodeIterator(this.elem(), NodeFilter.SHOW_ELEMENT);
                const iteratorClone = document.createNodeIterator(elementClone, NodeFilter.SHOW_ELEMENT);
                const addEvent = function(listener){
                    HD.DOM(elemClone).event(listener.eventName, listener.handler);
                };

                while ((elem = iterator.nextNode())){
                    listeners = getHandlers(elem);
                    while ((elemClone = iteratorClone.nextNode())){
                        if (elem.isEqualNode(elemClone)){
                            listeners.forEach(addEvent);
                            break;
                        }
                    }
                }
            }
            return HD.DOM(elementClone);
        },

        /**
         * Elem rekurzív másolása eseménykezelőkkel együtt és beszúrása egy másik elembe
         * @param {HTMLElement} insert - beszúrás helye
         * @param {Boolean} [prepend=false] - ha true, beszúrás az elejére
         * @returns {HTMLElement} az elem másolata
         */
        copyPaste : function(insert, prepend = false){
            const Clone = this.clone(true);

            if (prepend){
                insert.insertBefore(Clone.elem(), insert.firstChild);
            }
            else {
                insert.appendChild(Clone.elem());
            }
            Clone.class('remove', 'cloneable');
            return Clone.elem();
        },

        /**
         * Elemek eltávolítása
         * @returns {HD.DOM}
         */
        remove : function(){
            this.elements.forEach(function(elem){
                elem.parentNode.removeChild(elem);
            });
            return this;
        },

        /**
         * Eseménykezelő csatolása
         * @param {String} eventNames
         * @param {Function} handler
         * @returns {HD.DOM}
         */
        event : function(eventNames, handler){
            this.elements.forEach(function(target){
                eventNames.split(' ').forEach(function(eventName){
                    target.addEventListener(eventName, function(event){
                        handler.call(target, target, event);
                    }, false);
                    HD.DOM.eventListeners.push({
                        target : target,
                        eventName : eventName,
                        handler : handler
                    });
                });
            });
            return this;
        },

        /**
         * Eseménykezelők meghívása
         * @param {String} eventName
         * @returns {HD.DOM}
         */
        trigger : function(eventName){
            let handlers, eventObj;

            if (typeof Event === 'function'){
                eventObj = new Event(eventName, {
                    bubbles : true,
                    cancelable : true
                });
            }
            else {
                eventObj = document.createEvent('Event');
                eventObj.initEvent(eventName, true, true);
            }
            this.elements.forEach(function(target){
                handlers = getHandlers(target, eventName);
                handlers.forEach(function(handlerObj){
                    handlerObj.handler.call(target, eventObj);
                });
                if (!eventObj.isDefaultPrevented && typeof target[eventName] === 'function'){
                    target[eventName]();
                }
            });
            return this;
        },

        /**
         * Esemény kiváltása
         * @param {String} eventName
         * @returns {HD.DOM}
         */
        dispatch : function(eventName){
            let eventObj;

            if (typeof Event === 'function'){
                eventObj = new Event(eventName, {
                    bubbles : true,
                    cancelable : true
                });
            }
            else {
                eventObj = document.createEvent('Event');
                eventObj.initEvent(eventName, true, true);
            }
            this.elements.forEach(function(target){
                target.dispatchEvent(eventObj);
            });
            return this;
        }

    };

};

/**
 * Csatolt eseménykezelők belső tárolása
 * @type {Array.<Object>}
 * @description
 *  eventListeners = [
 *      {
 *          target : HTMLElement,
 *          eventName : String,
 *          handler : Function
 *      },
 *      ...
 *  ]
 */
HD.DOM.eventListeners = [];

/**
 * Csatolt adatok típusainak belső tárolása
 * @type {Array.<Object>}
 * @description
 *  dataObjects = [
 *      {
 *          element : HTMLElement,
 *          type : String,
 *          name : String,
 *          value : *
 *      },
 *      ...
 *  ]
 */
HD.DOM.dataObjects = [];

/**
 * Ajax kérés futtatása
 * @param {Object} options
 * @returns {Promise|null}
 * @description
 *  options = {
 *      method : String ('GET'|'POST'|'PUT'|'DELETE'|...)
 *      url : String
 *      data : String
 *      callback : Function
 *  }
 */
HD.DOM.ajax = function(options){
    let promise = null;
    const xhr = new XMLHttpRequest();
    const data = options.data || '';
    xhr.open(options.method, options.url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    if (typeof options.callback === 'function'){
        xhr.onload = function(){
            options.callback(xhr.responseText);
        };
    }
    else {
        promise = new Promise(function(resolve, reject){
            xhr.onload = function(){
                resolve(xhr.responseText);
            };
            xhr.onerror = function(){
                reject({
                    name : 'XHR error',
                    message : `Url: ${options.url}; Data: ${data}`
                });
            };
        });
    }
    xhr.send(data);
    return promise;
};

/**
 * Egér pozíciója egy elemhez képest
 * @param {Event} event - egérhez kapcsolódó esemény
 * @param {HTMLElement} [elem=document.body] - egy DOM elem
 * @returns {Object} egérpozíció
 * @description
 *  return = {
 *      x : Number,
 *      y : Number
 *  }
 */
HD.DOM.getMousePosition = function(event, elem = document.body){
    const offset = {x : 0, y : 0};

    do {
        if (!isNaN(elem.offsetLeft)){
            offset.x += elem.offsetLeft;
        }
        if (!isNaN(elem.offsetTop)){
            offset.y += elem.offsetTop;
        }
    } while ((elem = elem.offsetParent));
    return {
        x : event.pageX - offset.x,
        y : event.pageY - offset.y
    };
};

HD.DOM.openBase64 = function(fileSrc){
    window.open().document.write(`
        <iframe src="${fileSrc}" frameborder="0"
            style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;"
            allowfullscreen></iframe>
    `);
};

if (typeof exports !== 'undefined'){
    exports.DOM = HD.DOM;
}
