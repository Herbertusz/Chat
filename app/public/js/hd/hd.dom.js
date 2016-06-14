/*!
 * HD-keret DOM v1.0.0
 * 2016.06.11.
 */

/* global HD namespace */

"use strict";

var HD = namespace("HD");

/**
 * Alkalmazás csatolása DOM elemeket kezelő függvényekhez
 */
HD.DOM = {

    /**
     *
     * @type {Array}
     * @private
     */
    eventListeners : [],

    /**
     *
     * @param {HTMLElement} element
     * @returns {Array.<Object>}
     * @private
     */
    getHandlers : function(element){
        return HD.DOM.eventListeners.filter(function(listener){
            return listener.target === element;
        });
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {Boolean}
     * @private
     */
    matches : function(element, selector){
        var p = Element.prototype;
        var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s){
            return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
        };
        return f.call(element, selector);
    },

    /**
     *
     * @param {String} selector
     * @returns {Array.<HTMLElement>}
     */
    get : function(selector){
        return Array.from(document.querySelectorAll(selector));
    },

    /**
     *
     * @param {Array.<HTMLElement>} elements
     * @param {String} selector
     * @returns {Array.<HTMLElement>}
     */
    find : function(elements, selector){
        let find = [];
        elements.forEach(function(elem){
            find = find.concat(Array.from(elem.querySelectorAll(selector)));
        });
        return find;
    },

    /**
     *
     * @param {Array.<HTMLElement>} elements
     * @param {String} selector
     * @returns {Array.<HTMLElement>}
     */
    filter : function(elements, selector){
        return elements.filter(function(elem){
            return HD.DOM.matches(elem, selector);
        });
    },

    /**
     *
     * @param {String} name
     * @param {*} [value]
     * @returns {Array.<HTMLElement>}
     */
    getByData : function(name, value){
        if (typeof value === "undefined"){
            return HD.DOM.get(`[data-${name}]`);
        }
        else {
            return HD.DOM.get(`[data-${name}="${value}"]`);
        }
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} name
     * @returns {String}
     */
    getData : function(element, name){
        return element.getAttribute(`data-${name}`);
    },

    /**
     *
     * @param {Array.<HTMLElement>} elements
     * @param {String} name
     * @param {String} value
     */
    setData : function(elements, name, value){
        elements.forEach(function(elem){
            elem.setAttribute(`data-${name}`, value);
        });
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {Boolean} [withEvents=false]
     * @returns {Node}
     */
    clone : function(element, withEvents){
        withEvents = HD.Function.param(withEvents, false);
        const elementClone = element.cloneNode(true);
        if (withEvents){
            let elem, elemClone, listeners;
            const iterator = document.createNodeIterator(element, NodeFilter.SHOW_ELEMENT);
            const iteratorClone = document.createNodeIterator(elementClone, NodeFilter.SHOW_ELEMENT);
            const addEvent = function(listener){
                HD.DOM.event(elemClone, listener.eventName, listener.handler);
            };
            while ((elem = iterator.nextNode())){
                listeners = HD.DOM.getHandlers(elem);
                while ((elemClone = iteratorClone.nextNode())){
                    if (elem.isEqualNode(elemClone)){
                        listeners.forEach(addEvent);
                        break;
                    }
                }
            }
        }
        return elementClone;
    },

    /**
     *
     * @param {EventTarget|Array.<EventTarget>} targets
     * @param {String} eventName
     * @param {Function} handler
     * @returns {Array.<Number>}
     */
    event : function(targets, eventName, handler){
        const listenerIds = [];
        if (!Array.isArray(targets)){
            targets = [targets];
        }
        targets.forEach(function(target){
            target.addEventListener(eventName, handler.bind(target), false);
            listenerIds.push(HD.DOM.eventListeners.push({
                target : target,
                eventName : eventName,
                handler : handler
            }));
        });
        return listenerIds;
    },

    /**
     *
     * @param {EventTarget|Array.<EventTarget>} targets
     * @param {String} eventName
     * @returns {Event}
     */
    trigger : function(targets, eventName){
        if (!Array.isArray(targets)){
            targets = [targets];
        }
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
        targets.forEach(function(target){
            target.dispatchEvent(eventObj);
        });
        return eventObj;
    }

};
