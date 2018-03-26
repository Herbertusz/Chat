/**
 * HD-keret Tab
 *
 * @description Tab-kezelő
 * @requires jQuery
 * @example
 *  HTML-CSS: http://blog.webprog.biz/jquery-tabok
 *  const tab = new HD.Site.Tab({
 *      $trigger : $('ul.tab li'),
 *      activeClass : 'selected'
 *  });
 *  tab.init();
 */

/* global $ */

'use strict';

var HD = window.HD || {};
HD.Site = HD.Site || {};

/**
 * Tab objektum (Module minta)
 * @param {Object} options - beállítások
 * @returns {Object} tab-kezelő felület
 */
HD.Site.Tab = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     */
    const defaultOptions = {
        $trigger : $('.tab'),
        activeClass : 'active',
        dataGroup : 'tabgroup',
        dataId : 'tabid'
    };

    options = $.extend({}, defaultOptions, options);

    /**
     * Publikus felület
     * @type {Object}
     */
    const Interface = {

        /**
         * Felülírt beállítások
         * @type {Object}
         */
        options : options,

        /**
         * Eseménykezelő csatolása
         * @public
         */
        init : function(){
            options.$trigger.click(function(event){
                const group = $(event.target).data(options.dataGroup);
                const id = $(event.target).data(options.dataId);
                const $all = $('*');
                $all.filter(function(){
                    return $(event.target).data(options.dataGroup) === group;
                }).removeClass(options.activeClass);
                $all.filter(function(){
                    return $(event.target).data(options.dataGroup) === group &&
                        $(event.target).data(options.dataId) === id;
                }).addClass(options.activeClass);
            });
        }

    };

    return Interface;

};
