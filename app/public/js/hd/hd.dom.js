/*!
 * HD-keret DOM v1.0.0
 * 2016.06.11.
 *
 * @description DOM-kezelő
 * @example
 *  HD.DOM('.class').event("click", function(){...});
 *  HD.DOM('.class').find('button').setData('clickable', '1').trigger('click');
 *  var cloneElement = HD.DOM('.class').filter('[data-disabled]').clone(true).elements[0];
 */

/* global HD namespace */

"use strict";

var HD = namespace("HD");

/**
 * DOM elemeket kezelését segítő objektum (Module minta)
 * @param {String|HTMLElement} identifier
 * @returns {Object}
 */
HD.DOM = function(identifier){

    /**
     *
     * @param {HTMLElement} element
     * @returns {Array.<Object>}
     * @private
     */
    const getHandlers = function(element){
        return HD.DOM.eventListeners.filter(function(listener){
            return listener.target === element;
        });
    };

    /**
     *
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {Boolean}
     * @private
     */
    const matches = function(element, selector){
        var p = Element.prototype;
        var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s){
            return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
        };
        return f.call(element, selector);
    };

    return {

        /**
         * @type {Array.<HTMLElement>}
         */
        elements : (function(ident){
            if (typeof ident === "string"){
                // Szelektor
                return Array.from(document.querySelectorAll(ident));
            }
            else if (typeof ident === "object"){
                if (ident instanceof Array){
                    // Tömb
                    return ident;
                }
                else if (ident instanceof NodeList){
                    // Elemlista
                    return Array.from(ident);
                }
                else if (typeof ident.nodeType === "number" && ident.nodeType === Node.ELEMENT_NODE){
                    // DOM elem
                    return [ident];
                }
                else {
                    Error('Nem támogatott típus');
                }
            }
            else {
                Error('Nem támogatott típus');
            }
        })(identifier),

        /**
         *
         * @param {String} selector
         * @returns {HD.DOM}
         */
        find : function(selector){
            let find = [];
            this.elements.forEach(function(elem){
                find = find.concat(Array.from(elem.querySelectorAll(selector)));
            });
            this.elements = find;
            return this;
        },

        /**
         *
         * @param {Array.<HTMLElement>} elements
         * @param {String} selector
         * @returns {HD.DOM}
         */
        filter : function(elements, selector){
            this.elements = this.elements.filter(function(elem){
                return matches(elem, selector);
            });
            return this;
        },

        /**
         *
         * @param {String} name
         * @param {*} [value]
         * @returns {HD.DOM}
         */
        getByData : function(name, value){
            if (typeof value === "undefined"){
                this.elements = this.get(`[data-${name}]`);
            }
            else {
                this.elements = this.get(`[data-${name}="${value}"]`);
            }
            return this;
        },

        /**
         *
         * @param {String} name
         * @returns {String}
         */
        getData : function(name){
            return this.elements[0].getAttribute(`data-${name}`);
        },

        /**
         *
         * @param {String} name
         * @param {String} value
         * @returns {HD.DOM}
         */
        setData : function(name, value){
            this.elements.forEach(function(elem){
                elem.setAttribute(`data-${name}`, value);
            });
            return this;
        },

        /**
         *
         * @param {String} property
         * @param {Boolean} value
         * @returns {HD.DOM}
         */
        prop : function(property, value){
            this.elements.forEach(function(elem){
                elem[property] = value;
            });
            return this;
        },

        /**
         *
         * @param {Boolean} [withEvents=false]
         * @returns {HD.DOM}
         */
        clone : function(withEvents){
            withEvents = HD.Function.param(withEvents, false);
            const elementClone = this.elements[0].cloneNode(true);
            if (withEvents){
                let elem, elemClone, listeners;
                const iterator = document.createNodeIterator(this.elements[0], NodeFilter.SHOW_ELEMENT);
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
            this.elements = [elementClone];
            return this;
        },

        /**
         *
         * @param {String} eventName
         * @param {Function} handler
         * @returns {HD.DOM}
         */
        event : function(eventName, handler){
            this.elements.forEach(function(target){
                target.addEventListener(eventName, handler.bind(target), false);
                HD.DOM.eventListeners.push({
                    target : target,
                    eventName : eventName,
                    handler : handler
                });
            });
            return this;
        },

        /**
         *
         * @param {String} eventName
         * @returns {HD.DOM}
         */
        trigger : function(eventName){
            let eventObj;
            if (typeof Event === "function"){
                eventObj = new Event(eventName, {
                    bubbles : true,
                    cancelable : true
                });
            }
            else {
                eventObj = document.createEvent("Event");
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
 *
 * @type {Array.<Object>}
 * @private
 */
HD.DOM.eventListeners = [];
