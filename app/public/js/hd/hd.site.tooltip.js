/**
 * HD-keret Tooltip
 *
 * @description Tooltip-kezelő
 * @requires jQuery, jQuery UI position
 * @example
 *  const tooltip = new HD.Site.Tooltip({
 *      position : {
 *          my : 'left center',
 *          at : 'right center',
 *          collision : 'flip fit'
 *      },
 *      positionMouse : false
 *  });
 *  tooltip.init();
 */

'use strict';

var HD = window.HD || {};
HD.Site = HD.Site || {};

/**
 * Tooltip objektum (Module minta)
 * @param {Object} options - beállítások
 * @returns {Object} tooltip felület
 */
HD.Site.Tooltip = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     */
    const defaultOptions = {
        $trigger : $('.tooltip'),
        $boxElement : $('#tooltipbox'),
        boxContent : function($trigger){
            const text = $trigger.attr('title');
            $trigger.removeAttr('title');
            return text;
        },
        position : {
            my : 'left+15 top+10',
            at : 'right bottom',
            collision : 'flip fit'
        },
        positionMouse : true,
        drag : false,
        afterInit : function(){}
    };

    /**
     * Jelenleg látható-e a tooltip
     * @type {Boolean}
     */
    let visible = false;

    options = $.extend({}, defaultOptions, options);

    /**
     * Tooltip pozicionálása
     * @param {jQuery.Event|HTMLElement} positionOf
     */
    const setPosition = function(positionOf){
        if (visible){
            const position = options.position;
            position.of = positionOf;
            options.$boxElement.position(position);
        }
    };

    /**
     * Tooltip megjelenítése
     * @param {String} text
     * @param {jQuery.Event} event
     * @param {HTMLElement} element
     */
    const show = function(text, event, element){
        if (typeof text !== 'undefined' && text.length > 0){
            options.$boxElement.show().html(text);
            visible = true;
            if (options.positionMouse){
                setPosition(event);
            }
            else {
                setPosition(element);
            }
        }
    };

    /**
     * Tooltip eltüntetése
     */
    const hide = function(){
        options.$boxElement.hide().html('');
        visible = false;
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
         * Tooltip létrehozása
         * @public
         */
        init : function(){
            const $trigger = options.$trigger;
            $trigger.each(function(i, elem){
                const text = options.boxContent($(elem));
                $(elem).data('text', text);
            });
            $trigger.mouseover(function(event){
                show($(event.target).data('text'), event, event.target);
            });
            $trigger.mouseout(function(event){
                hide();
            });
            if (options.drag){
                $trigger.mousemove(function(event){
                    setPosition(event);
                });
            }
            options.afterInit(options);
        }

    };

    return Interface;

};
