/*!
 * HD-keret Tab v1.0.0
 * 2015.02.21.
 *
 * @description Tab-kezelő
 * @example
 *  HTML-CSS: http://blog.webprog.biz/jquery-tabok
 *  const tab = new HD.Site.Tab({
 *      $trigger : $('ul.tab li'),
 *      activeClass : "selected"
 *  });
 *  tab.init();
 */

/* global HD namespace */

"use strict";

HD.Site = namespace("HD.Site");

/**
 * Tab objektum (Module minta)
 * @param {Object} options beállítások
 * @returns {Object} tab-kezelő felület
 */
HD.Site.Tab = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     */
    const defaultOptions = {
        $trigger : $(".tab"),
        activeClass : "active",
        dataGroup : "tabgroup",
        dataId : "tabid"
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
            options.$trigger.click(function(){
                const group = $(this).data(options.dataGroup);
                const id = $(this).data(options.dataId);
                const $all = $('*');
                $all.filter(function(){
                    return $(this).data(options.dataGroup) === group;
                }).removeClass(options.activeClass);
                $all.filter(function(){
                    return $(this).data(options.dataGroup) === group && $(this).data(options.dataId) === id;
                }).addClass(options.activeClass);
            });
        }

    };

    return Interface;

};
