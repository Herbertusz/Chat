/*!
 * HD-keret Utility v1.0.0
 * 2015.02.21.
 */

"use strict";

var HD = namespace("HD");

/**
 * Általános műveletek és adatok
 * @type {Object}
 */
HD.Misc = {

	/**
	 * Speciális billentyűk
	 * @type {Object}
	 */
	keys : {
		ALT: 18, BACKSPACE: 8, CAPS_LOCK: 20, COMMA: 188, CTRL: 17, DELETE: 46, DOWN: 40, END: 35, ENTER: 13,
		ESC: 27, HOME: 36, INSERT: 45, LEFT: 37, NUM_LOCK: 144, NUMPAD_ADD: 107, NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111, NUMPAD_ENTER: 108, NUMPAD_MULTIPLY: 106, NUMPAD_SUBTRACT: 109, PAGE_DOWN: 34,
		PAGE_UP: 33, PAUSE: 19, PERIOD: 190, RIGHT: 39, RIGHT_CLICK: 93, SCROLL_LOCK: 145, SHIFT: 16, SPACE: 32,
		TAB: 9, UP: 38, WINDOWS: 91
	},

	/**
	 * Alfanumerikus karakterek
	 * @type {Object}
	 */
	letters : {
		"a": 65, "b": 66, "c": 67, "d": 68, "e": 69, "f": 70, "g": 71, "h": 72, "i": 73,
		"j": 74, "k": 75, "l": 76, "m": 77, "n": 78, "o": 79, "p": 80, "q": 81, "r": 82,
		"s": 83, "t": 84, "u": 85, "v": 86, "w": 87, "x": 88, "y": 89, "z": 90,
		"0": 48, "1": 49, "2": 50, "3": 51, "4": 52, "5": 53, "6": 54, "7": 55, "8": 56, "9": 57
	},

	/**
	 * Alapértelmezett paraméterérték megadása függvényben
	 * @example par = funcParam(par, 0);
	 * @param {Object} param paraméter
	 * @param {Object} value alapértelmezett érték
	 * @returns {Object} ezt kell értékül adni a paraméternek
	 */
	funcParam : function(param, value){
		if (typeof param === "undefined"){
			return value;
		}
		else {
			return param;
		}
	},

	/**
	 * Switch szerkezetet helyettesítő függvény
	 * @param {Object} variable változó
	 * @param {Object} relations változó különböző értékeihez rendelt visszatérési értékek
	 * @param {Object} [defaultValue=null] alapértelmezett érték (default)
	 * @returns {Object|null}
	 */
	switching : function(variable, relations, defaultValue){
		if (typeof defaultValue === "undefined") defaultValue = null;
		for (var index in relations){
			if (variable === index){
				return relations[index];
			}
		}
		return defaultValue;
	}

};

/**
 * Szám-műveletek (Number objektum kiegészítései)
 * @type {Object}
 */
HD.Number = {

	/**
	 * Szám elejének feltöltése nullákkal
	 * @param {Number} num szám
	 * @param {Number} len kívánt hossz
	 * @returns {String} nullákkal feltöltött szám
	 */
	fillZero : function(num, len){
		var numStr = "";
		var originalNumStr = num.toString();
		var originalLen = originalNumStr.length;
		for (var n = originalLen; n < len; n++){
			numStr += "0";
		}
		return numStr + originalNumStr;
	},

	/**
	 * Fájlméret kiírása
	 * @param {Number} size méret bájtokban
	 * @param {Number} [precision=2] pontosság (tizedesjegyek száma)
	 * @param {Number} [prefixLimit=0.5] ha ennél kisebb, az alacsonyabb prefixum használata
	 * @returns {String} olvasható érték
	 */
	displaySize : function(size, precision, prefixLimit){
		if (typeof precision === "undefined") precision = 2;
		if (typeof prefixLimit === "undefined") prefixLimit = 0.5;
		var n = 1.0;
		var pref = ["", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
		var k, i;
		for (k = 0; k < precision; k++){
			n *= 10.0;
		}
		for (i = 1; i < 9; i++){
			if (size < Math.pow(1024, i) * prefixLimit){
				return Math.round((size / Math.pow(1024.0, i - 1)) * n) / n + " " + pref[i] + "B";
			}
		}
		return Math.round((size / Math.pow(1024.0, i - 1)) * n) / n + " " + pref[i] + "B";
	},

	/**
	 * Fájlméret visszafejtése (a displaysize inverze)
	 * Pl.: "10.5 MB", "1000kB", "3 400 000 B", "2,7 GB"
	 * @param {String} size méret olvasható formában
	 * @returns {Number} értéke bájtban
	 */
	recoverSize : function(size){
		var numberpart, multiply, offset, prefixum, index, n, q = "";
		var pref = {
			none : 1,
			k : 1024,
			M : 1048576,
			G : 1073741824,
			T : 1099511627776
		};
		for (n = size.length - 1; n >= 0; n--){
			if (/[0-9]/.test(size[n])){
				n++;
				break;
			}
			q += size[n];
		}
		if (n === 0){
			// nincs numerikus karakter
			numberpart = 0.0;
		}
		else {
			if (q.length === 0){
				offset = size.length;
			}
			else {
				offset = size.length - q.length;
			}
			numberpart = size.substr(0, offset);
			if (size.indexOf(".") === -1 && size.indexOf(",") > -1){
				numberpart = numberpart.replace(",", ".");
			}
			numberpart = numberpart.replace(" ", "");
		}
		q = $.trim(this.reverse(q).toLowerCase());
		if (q.length === 2){
			prefixum = q[0];
			if (pref.hasOwnProperty(prefixum)){
				for (index in pref){
					if (index === prefixum){
						multiply = pref[index];
						break;
					}
				}
			}
			else if (pref.hasOwnProperty(prefixum.toUpperCase())){
				for (index in pref){
					if (index === prefixum.toUpperCase()){
						multiply = pref[index];
						break;
					}
				}
			}
			else {
				// nincs ilyen prefixum definiálva
				multiply = 0.0;
			}
		}
		else if (q.length === 1){
			// nincs prefixum
			multiply = pref.none;
		}
		else {
			// nincs mértékegység megadva vagy túl hosszú
			multiply = 0.0;
		}
		return parseFloat(multiply) * parseFloat(numberpart);
	}

};

/**
 * Karakterlánc műveletek (String objektum kiegészítései)
 * @type {Object}
 */
HD.String = {

	/**
	 * Első karakter nagybetűssé alakítása
	 * @param {String} str
	 * @returns {String}
	 */
	ucFirst : function(str){
		return str[0].toUpperCase() + str.slice(1);
	},

	/**
	 * A php urlencode() függvényével egyenértékű
	 * @param {String} str
	 * @returns {String}
	 */
	urlEncode : function(str){
		str = (str + '').toString();
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
				replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	},

	/**
	 * Karakterlánc megfordítása
	 * @param {String} str karakterlánc
	 * @returns {String} karakterlánc visszafelé
	 */
	reverse : function(str){
		var splitext = str.split("");
		var revertext = splitext.reverse();
		return revertext.join("");
	},

	/**
	 * Előtag eltávolítása a karakterláncról
	 * @param {String} str karakterlánc
	 * @param {String} separator előtag kapcsoló karakter
	 * @returns {String} maradék karakterlánc
	 */
	removePrefix : function(str, separator){
		var arr = str.split(separator);
		arr.shift();
		return arr.join(separator);
	},

	/**
	 * E-mail cím ellenőrzés
	 * @param {String} email e-mail cím
	 * @returns {Boolean} true, ha jó a formátum
	 */
	validateEmail : function(email){
		return !!/^[a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+$/.test(email);
	}

};

/**
 * Tömb műveletek (Array objektum kiegészítései)
 * @type {Object}
 */
HD.Array = {

	/**
	 * A PHP in_array() függvénye (indexOf boolean változata)
	 * @param {Object} needle keresendő elem
	 * @param {Array} haystack tömb
	 * @returns {Boolean}
	 */
	inArray : function(needle, haystack){
		var len, i;
		if (haystack){
			if (Array.prototype.indexOf){
				return (Array.prototype.indexOf.call(haystack, needle) > -1);
			}
			len = haystack.length;
			for (i = 0; i < len; i++){
				if (i in haystack && haystack[i] === needle){
					return true;
				}
			}
		}
		return false;
	},

	/**
	 * Általános indexOf
	 * @param {Object} val keresendő elem
	 * @param {Array} arr tömb
	 * @param {Function} comparer összehasonlító függvény
	 * @returns {Number}
	 */
	indexOf : function(val, arr, comparer){
		var i, len;
		for (i = 0, len = arr.length; i < len; ++i){
			if (i in arr && comparer(arr[i], val)){
				return i;
			}
		}
		return -1;
	},

	/**
	 * Hozzáadás tömbhöz, ha még nem tartalmazza az adott értéket
	 * @param {Array} arr tömb
	 * @param {Object} val érték
	 * @returns {Array} módosított tömb
	 */
	addByVal : function(arr, val){
		if (arr.indexOf(val) === -1){
			arr.push(val);
		}
		return arr;
	},

	/**
	 * Érték eltávolítása a tömbből
	 * @param {Array} arr tömb
	 * @param {Object} val érték
	 * @returns {Array} módosított tömb
	 */
	removeByVal : function(arr, val){
		var index = arr.indexOf(val);
		if (index > -1){
			arr.slice(index, 1);
		}
		return arr;
	}

};

/**
 * Objektum műveletek (Object objektum kiegészítései)
 * @type {Object}
 */
HD.Object = {

	/**
	 * Objektumok közti részleges egyezés vizsgálata
	 * @param {Object} partialObject keresendő rész
	 * @param {Object} fullObject keresett objektum
	 * @returns {Boolean} a keresett objektum tartalmazza a keresendő részt
	 */
	objectPartialMatch : function(partialObject, fullObject){
		var properties = Object.keys(fullObject);
		for (var n = 0; n < properties.length; n++){
			if (partialObject[properties[n]] !== undefined && partialObject[properties[n]] !== fullObject[properties[n]]){
				return false;
			}
		}
		return true;
	}

};
