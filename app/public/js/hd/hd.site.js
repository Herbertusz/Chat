/*!
 * HD-keret Site v1.0.0
 * 2015.02.21.
 */
/* global HD namespace */

"use strict";

var HD = namespace("HD");

/**
 * Web-műveletek
 * @type {Object}
 */
HD.Site = {

	/**
	 * E-mail cím dekódolása (spam ellen)
	 * @param {String} params paraméterek "valami,domain.hu" alakban
	 * @returns {String} e-mail cím (valami@domain.hu)
	 */
	emailDecode : function(params){
		var p = params.split(",");
		return `${p[0]}@${p[1]}`;
	},

	/**
	 * Egér pozíciója egy elemhez képest
	 * @param {Event} event egérhez kapcsolódó esemény
	 * @param {HTMLElement} [elem=document.body] egy DOM elem
	 * @returns {Object} egérpozíció
	 */
	getMousePosition : function(event, elem){
		var offset = {x : 0, y : 0};
		if (typeof elem === "undefined") elem = document.body;
		do {
			if (!isNaN(elem.offsetLeft)){
				offset.x += elem.offsetLeft;
			}
			if (!isNaN(elem.offsetTop)){
				offset.y += elem.offsetTop;
			}
		} while ((elem = elem.offsetParent));
		return {
			x : event.pageX - offset.x,
			y : event.pageY - offset.y
		};
	},

	/**
	 * Szövegkijelölés és képletöltés tiltása
	 */
	protection : function(){
		$('p').mousedown(function(event){
			event.preventDefault();
		});
		document.onselectstart = function(){ return false; };
		document.unselectable = 'on';
		$('body').css({
			'user-select' : 'none',
			'-o-user-select' : 'none',
			'-moz-user-select' : 'none',
			'-khtml-user-select' : 'none',
			'-webkit-user-select' : 'none'
		});
		$('img').bind("mouseup", function(event){
			if (event.which === 3){
				event.preventDefault();
				event.stopPropagation();
			}
		}).bind("contextmenu", function(){
			return false;
		});
	},

	/**
	 * Drag-n-drop kurzor létrehozása egy elemen
	 * @param {jQuery} $elem húzható elemek
	 * @param {String} openhand hover kurzor teljes elérési útja
	 * @param {String} closehand drag kurzor teljes elérési útja
	 */
	grabCursor : function($elem, openhand, closehand){
		var cssValueOpen = `url(${openhand}), move`;
		var cssValueClose = `url(${closehand}), move`;
		$elem.css({
			"cursor" : cssValueOpen
		});
		$elem.mouseover(function(){
			$(this).css({
				"cursor" : cssValueOpen
			});
		});
		$elem.mousedown(function(){
			$(this).css({
				"cursor" : cssValueClose
			});
		});
		$elem.mouseup(function(){
			$(this).css({
				"cursor" : cssValueOpen
			});
		});
	},

	/**
	 * Űrlapelemek értékeinek összegyűjtése (tömbkezelés csak alapszinten)
	 * @param {jQuery} $elements űrlapelemek
	 * @returns {Object}
	 */
	formCollect : function($elements){
		var data = {};
		var name;
		var serial = $elements.serializeArray();
		$.each(serial, function(){
			if (this.name.substr(-2) === "[]"){
				name = this.name.substr(0, this.name.length - 2);
				if (typeof data[name] !== "undefined"){
					data[name].push(this.value);
				}
				else {
					data[name] = [this.value];
				}
			}
			else {
				data[this.name] = this.value;
			}
		});
		return data;
	},

	/**
	 * Hozzáadás könyvjelzőkhöz
	 * @param {String} url URL
	 * @param {String} title cím
	 */
	addBookmark : function(url, title){
		var a;
		if (window.sidebar){
			window.sidebar.addPanel(title, url, "");
		}
		else if (window.opera && window.print){
			a = document.createElement("a");
			a.setAttribute("rel", "sidebar");
			a.setAttribute("href", url);
			a.setAttribute("title", title);
			a.click();
		}
		else if (document.all){
			window.external.AddFavorite(url, title);
		}
	},

	/**
	 * Caps Lock ellenőrzés
	 * @param {Event} event Event objektum
	 * @returns {Boolean} true: le van nyomva a caps lock
	 */
	isDownCapsLock : function(event){
		var _keyCode = event.which;
		var _keyShift = event.shiftKey ? event.shiftKey : (_keyCode === 16);
		return ((_keyCode >= 65 && _keyCode <= 90) && !_keyShift) || ((_keyCode >= 97 && _keyCode <= 122) && _keyShift);
	}

};
