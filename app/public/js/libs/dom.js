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
     */
    eventListeners : [],

    /**
     *
     * @param {String} selector
     * @returns {Array.<HTMLElement>}
     */
    getAll : function(selector){
        return Array.from(document.querySelectorAll(selector));
    },

    /**
     *
     * @param {String} selector
     * @returns {HTMLElement}
     */
    get : function(selector){
        return document.querySelector(selector);
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {Array.<HTMLElement>}
     */
    findAll : function(element, selector){
        return Array.from(element.querySelectorAll(selector));
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {HTMLElement}
     */
    find : function(element, selector){
        return element.querySelector(selector);
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} selector
     * @returns {Boolean}
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
    getByDataAll : function(name, value){
        if (typeof value === "undefined"){
            return this.getAll(`[data-${name}]`);
        }
        else {
            return this.getAll(`[data-${name}="${value}"]`);
        }
    },

    /**
     *
     * @param {String} name
     * @param {*} [value]
     * @returns {HTMLElement}
     */
    getByData : function(name, value){
        if (typeof value === "undefined"){
            return this.get(`[data-${name}]`);
        }
        else {
            return this.get(`[data-${name}="${value}"]`);
        }
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {String} name
     * @returns {Mixed}
     */
    getData : function(element, name){
        return element.getAttribute(`data-${name}`);
    },

    /**
     *
     * @param {HTMLElement} element
     * @param {Boolean} [withEvents=false]
     * @returns {HTMLElement}
     */
    clone : function(element, withEvents){
        withEvents = HD.Function.param(withEvents, false);
        if (!withEvents){
            return element.cloneNode(true);
        }
        else {
            return $(element).clone(true, true).get(0);
        }
    },

    /**
     *
     * @param {EventTarget} target
     * @param {String} eventName
     * @param {Function} handler
     */
    event : function(target, eventName, handler){
        target.addEventListener(eventName, handler, false);
        return this.eventListeners.push({
            target : target,
            eventName : eventName,
            handler : handler
        });
    }

};
