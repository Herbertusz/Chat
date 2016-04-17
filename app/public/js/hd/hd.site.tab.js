/*!
 * HD-keret Tab v1.0.0
 * 2015.02.21.
 *
 * @description Tab-kezelő
 * @example
 *	HTML-CSS: http://blog.webprog.biz/jquery-tabok
 *	var tab = new HD.Site.Tab({
 *		$trigger : $('ul.tab li'),
 *		activeClass : "selected"
 *	});
 *	tab.init();
 */

"use strict";

HD.Site = namespace("HD.Site");

/**
 * Tab objektum (Module minta)
 * @param {Object} options beállítások
 * @returns {Tab} tab-kezelő felület
 */
HD.Site.Tab = function(options){

	/**
	 * Alapértelmezett beállítások
	 * @type {Object}
	 */
	var defaultOptions = {
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
	var Interface = {

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
				var group = $(this).data(options.dataGroup);
				var id = $(this).data(options.dataId);
				$(':data(' + options.dataGroup + ',' + group + ')').removeClass(options.activeClass);
				$(':data(' + options.dataGroup + ',' + group + '):data(' + options.dataId + ',' + id + ')').addClass(options.activeClass);
			});
		}

	};

	return Interface;

};
