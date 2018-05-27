/**
 * HD-keret Összenyomható menü
 *
 * @description Összenyomható menü
 * @requires jQuery
 * @example
 *  HTML-CSS: public/sandbox/hamb.html
 *  const menucompress = new HD.Site.Hamburger({
 *      menu : '.menu:not(.menu-clone)',
 *      stretcher : '.stretcher',
 *      hamb : '.main > li.hamb',
 *      item : '.main > li:not(.hamb)',
 *      hambList : '.sub',
 *      hambItem : '.sub > li',
 *      hambActiveClass : 'active',
 *      cloneClass : 'menu-clone',
 *      maxDiff : 10
 *  });
 *  menucompress.init();
 */

/* global $ */

'use strict';

var HD = window.HD || {};
HD.Site = HD.Site || {};

/**
 * Tab objektum (Module minta)
 * @param {Object} options - beállítások
 * @returns {Object} felület
 */
HD.Site.Hamburger = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     * @description
     *  defaultOptions = {
     *      menu : String,             // Menü szelektora
     *      stretcher : String,        // Menün belüli "nyúlóelem" szelektora
     *      hamb : String,             // Hamburgerjel szelektora
     *      item : String,             // Menüpontok szelektora (hamburgerjel nélkül)
     *      hambList : String,         // Hamburgerjel alatti menü szelektora
     *      hambItem : String,         // Hamburgerjel alatti menüpontok szelektora
     *      hambActiveClass : String,  // Látható hamburgerjel CSS class-a
     *      cloneClass : String,       // Menü-klón szelektora
     *      maxDiff : Number           // Maximális tűréshatár (px)
     *  }
     */
    const defaultOptions = {
        menu : '',
        stretcher : '',
        hamb : '',
        item : '',
        hambList : '',
        hambItem : '',
        hambActiveClass : '',
        cloneClass : '',
        maxDiff : 10
    };

    options = $.extend({}, defaultOptions, options);

    /**
     * Menü
     * @type {jQuery}
     */
    let $menu = null;

    /**
     * Menü klón
     * @type {jQuery}
     */
    let $menuClone = null;

    /**
     * Menüpont berakása a hamburgerjel alá
     * @param {Boolean} real - true: menüben, false: menü-klónban
     */
    const pushHamb = function(real){
        const $thisMenu = real ? $menu : $menuClone;
        $thisMenu.find(options.hambList).prepend($thisMenu.find(options.item).last());
        $thisMenu.find(options.hamb).addClass(options.hambActiveClass);
    };

    /**
     * Menüpont kiszedése a hamburgerjel alól
     * @param {Boolean} real - true: menüben, false: menü-klónban
     */
    const popHamb = function(real){
        const $thisMenu = real ? $menu : $menuClone;
        $thisMenu.find(options.hamb).before($thisMenu.find(options.hambItem).first());
        if ($thisMenu.find(options.hambItem).length === 0){
            $thisMenu.find(options.hamb).removeClass(options.hambActiveClass);
            return false;
        }
        else {
            return true;
        }
    };

    /**
     * Mérés és ettől függően menüpontok áthelyezése
     */
    const menuCalc = function(){
        let outerWidth = $menu.width();
        let innerWidth = $menuClone.find(options.stretcher).width();
        const maxDiff = options.maxDiff;

        while (outerWidth - innerWidth < maxDiff){
            outerWidth = $menu.width();
            innerWidth = $menuClone.find(options.stretcher).width();
            pushHamb(false);
            pushHamb(true);
        }
        while (outerWidth - innerWidth >= maxDiff){
            popHamb(false);
            outerWidth = $menu.width();
            innerWidth = $menuClone.find(options.stretcher).width();
            if (outerWidth - innerWidth < maxDiff){
                pushHamb(false);
                break;
            }
            else if (!popHamb(true)){
                break;
            }
        }
    };

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
         * Menü klónozása és eseménykezelők létrehozása
         * @public
         */
        init : function(){
            $menu = $(options.menu);
            $menuClone = $menu.clone().css({
                visibility : 'hidden',
                position : 'absolute'
            }).appendTo('body').addClass(options.cloneClass);

            menuCalc();
            $(window).resize(function(){
                menuCalc();
            });
        }

    };

    return Interface;

};
