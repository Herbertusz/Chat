/*!
 * HD-keret Tooltip v1.0.0
 * 2015.02.21.
 *
 * @description Tooltip-kezelő
 * @requires jQuery UI position
 * @example
 *  var tooltip = new HD.Site.Tooltip({
 *      position : {
 *          my : "left center",
 *          at : "right center",
 *          collision : "flip fit"
 *      },
 *      positionMouse : false
 *  });
 *  tooltip.init();
 */

"use strict";

HD.Site = namespace("HD.Site");

/**
 * Tooltip objektum (Module minta)
 * @param {Object} options beállítások
 * @returns {Tooltip} tooltip felület
 */
HD.Site.Tooltip = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     */
    var defaultOptions = {
        $trigger : $(".tooltip"),
        $boxElement : $("#tooltipbox"),
        boxContent : function($trigger){
            var text = $trigger.attr("title");
            $trigger.removeAttr("title");
            return text;
        },
        position : {
            my: "left+15 top+10",
            at: "right bottom",
            collision: "flip fit"
        },
        positionMouse : true,
        drag : false,
        afterInit : function(options){}
    };

    /**
     * Jelenleg látható-e a tooltip
     * @type {Boolean}
     */
    var visible = false;

    options = $.extend({}, defaultOptions, options);

    /**
     * Tooltip pozicionálása
     * @param {jQuery.Event|HTMLElement} positionOf
     */
    var setPosition = function(positionOf){
        var position;
        if (visible){
            position = options.position;
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
    var show = function(text, event, element){
        if (typeof text !== "undefined" && text.length > 0){
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
    var hide = function(){
        options.$boxElement.hide().html("");
        visible = false;
    };

    /**
     * Publikus felület
     * @type {Object}
     */
    var Interface = {

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
            var $trigger = options.$trigger;
            $trigger.each(function(){
                var text = options.boxContent($(this));
                $(this).data("text", text);
            });
            $trigger.mouseover(function(event){
                show($(this).data("text"), event, this);
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
