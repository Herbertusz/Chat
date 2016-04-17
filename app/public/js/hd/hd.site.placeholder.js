/*!
 * HD-keret Placeholder v1.0.0
 * 2015.02.21.
 *
 * @description Placeholder-kezelő
 * @example
 *	HD.Site.Placeholder();
 */

"use strict";

HD.Site = namespace("HD.Site");

/**
 * HTML5 placeholder attribútum megvalósítása IE6-9-ben (újabb böngészőkben nem fut le)
 * @type {Object}
 */
HD.Site.Placeholder = function(){

	var ph = this;

	/**
	 * IE verziószáma
	 * @returns {Number}
	 */
	var IEversion = function(){
		var version = 999;
		if (navigator.appVersion.indexOf("MSIE") !== -1){
			version = parseFloat(navigator.appVersion.split("MSIE")[1]);
		}
		return version;
	};

	/**
	 * Jelszómező típusának változtatása
	 * @param {jQuery} $elem
	 * @param {String} to
	 */
	var changePassField = function($elem, to){
		if (!(this.IEversion() < 9.0) && $elem.get(0).tagName === "INPUT"){
			if (to === "init"){
				if ($elem.attr("type") === "password"){
					$elem.data("type", "password");
					$elem.get(0).type = "text";
				}
			}
			if (to === "text"){
				if ($elem.data("type") === "password"){
					$elem.get(0).type = "text";
				}
			}
			if (to === "password"){
				if ($elem.data("type") === "password"){
					$elem.get(0).type = "password";
				}
			}
		}
	};

	if ("placeholder" in document.createElement("input")) return;
	$("[placeholder]").each(function(){
		if ($(this).val().length === 0){
			$(this).val($(this).attr("placeholder"));
			$(this).addClass("placeholder");
			ph.changePassField($(this), "init");
		}
	}).focus(function(){
		if ($(this).val() === $(this).attr("placeholder")){
			$(this).val("");
			$(this).removeClass("placeholder");
			ph.changePassField($(this), "password");
		}
	}).blur(function(){
		if ($(this).val().length === 0){
			$(this).val($(this).attr("placeholder"));
			$(this).addClass("placeholder");
			ph.changePassField($(this), "text");
		}
	}).change(function(){
		if ($(this).val().length > 0 && $(this).val() !== $(this).attr("placeholder")){
			$(this).removeClass("placeholder");
			ph.changePassField($(this), "password");
		}
	});
	$('form').submit(function(){
		$(this).find('[placeholder]').each(function(){
			if ($(this).val() === $(this).attr("placeholder")){
				$(this).val("");
			}
		});
	});

};
