/*!
 * HD-keret Canvas Layer v1.0.0
 * 2015.02.21.
 *
 * @description 2D layer-kezelés
 * @example http://canvas.webprog.biz/layer
 */

"use strict";

HD.Canvas = namespace("HD.Canvas");

/**
 * Rétegcsoportokat kezelő objektum (Module minta)
 * @param {HTMLCanvasElement} canvas a canvas elem amelyikhez a layerset tartozik
 * @param {Layer} [layer] tetszőleges számú réteg
 * @returns {Layerset}
 */
HD.Canvas.Layerset = function(canvas, layer){

	/**
	 * Ciklusváltozó
	 * @type {Number}
	 */
	var _i;

	/**
	 * A rétegek
	 * @private
	 * @type {Array.<Object>}
	 */
	var layers = [];

	/**
	 * Réteg keresése a layerset-ben
	 * @private
	 * @param {Layer} layer a keresett réteg
	 * @returns {Number|Boolean} a réteg indexe vagy false
	 */
	var getLayerIndex = function(layer){
		for (var n = 0; n < layers.length; n++){
			if (layers[n] === layer){
				return n;
			}
		}
		return false;
	};

	/**
	 * A zAxis értékek beállítása a zIndex-ek alapján
	 * @private
	 */
	var resetZAxis = function(){
		var n;
		layers.sort(function(a, b){
			if (a.zIndex === null) a.zIndex = 0;
			if (b.zIndex === null) b.zIndex = 0;
			if (a.zIndex > b.zIndex){
				return 1;
			}
			if (a.zIndex < b.zIndex){
				return -1;
			}
			return 0;
		});
		for (n = 0; n < layers.length; n++){
			layers[n].zAxis = n;
		}
	};

	var Interface = {

		/**
		 * A canvas elem amelyikhez a layerset tartozik
		 * @type {HTMLCanvasElement}
		 */
		canvas : canvas,

		/**
		 * Réteg beszúrása
		 * @param {Layer} layer az új réteg
		 * @param {Number|String} [zOverwrite="remain"] az új réteg helye (Number|"remain"|"top"|"bg")
		 * @returns {Layerset}
		 */
		pushLayer : function(layer, zOverwrite){
			if (typeof zOverwrite === "undefined") zOverwrite = "remain";
			if (zOverwrite === "top"){
				// legfelső réteg
				layers.push(layer);
			}
			else if (zOverwrite === "bg"){
				// háttérréteg
				layers.unshift(layer);
			}
			else if (zOverwrite === "remain"){
				// beszúrás a benne tárolt zIndex alapján
				resetZAxis();
			}
			else {
				// beszúrás a paraméter alapján
				layers.splice(zOverwrite, 0, layer);
			}
			layer.ownerSet = this;
			return this;
		},

		/**
		 * Réteg törlése
		 * @param {Layer} layer az eltávolítandó réteg
		 * @returns {Layerset}
		 */
		removeLayer : function(layer){
			var n = getLayerIndex(layer);
			if (n !== false){
				layers.splice(n, 1);
				layer.clear();
				this.reDraw();
			}
			return this;
		},

		/**
		 * Réteg mozgatása a z-tengelyen
		 * @param {Layer} layer a mozdítandó réteg
		 * @param {String} location mozgatás iránya ("down"|"up"|"bg"|"top")
		 * @param {Number} [num=1] down és up esetében a lépések száma
		 * @returns {Layerset}
		 */
		moveLayer : function(layer, location, num){
			if (typeof num === "undefined") num = 1;
			var temp, i;
			var max = layers.length - 1;
			var n = getLayerIndex(layer);
			if (n !== false){
				if (location === "up"){
					for (i = 0; n < max && i < num; n++, i++){
						temp = layers[n + 1];
						layers[n + 1] = layers[n];
						layers[n] = temp;
					}
				}
				else if (location === "down"){
					for (i = 0; n > 0 && i < num; n--, i++){
						temp = layers[n - 1];
						layers[n - 1] = layers[n];
						layers[n] = temp;
					}
				}
				else if (location === "top"){
					for (; n < max; n++){
						temp = layers[n + 1];
						layers[n + 1] = layers[n];
						layers[n] = temp;
					}
				}
				else if (location === "bg" && n > 0){
					for (; n > 0; n--){
						temp = layers[n - 1];
						layers[n - 1] = layers[n];
						layers[n] = temp;
					}
				}
				this.reDraw();
			}
			return this;
		},

		/**
		 * Újrarajzolás
		 * @param {Array(Layer)} [except=[]] ezeket a rétegeket nem rajzolja újra
		 * @returns {Layerset}
		 */
		reDraw : function(except){
			if (typeof except === "undefined") except = [];
			var n;
			resetZAxis();
			for (n = 0; n < layers.length; n++){
				if (except.indexOf(layers[n]) === -1 && !layers[n].hidden){
					layers[n].reDraw();
				}
			}
			return this;
		}

	};

	for (_i = 1; _i < arguments.length; _i++){
		layers[_i - 1] = arguments[_i];
		layers[_i - 1].ownerSet = Interface;
	}
	resetZAxis();

	return Interface;

};

/**
 * Rétegeket kezelő objektum (Module minta)
 * @param {Function} [subCommand] műveletek
 * @param {Number} [z] előírt zIndex érték (különben a Layerset-ben megadott sorrend határozza meg)
 * @returns {Layer}
 */
HD.Canvas.Layer = function(subCommand, z){

	/**
	 * Az eddigi műveletek tárolása
	 * @private
	 * @type {Array.<Function>}
	 */
	var drawing = [];

	var Interface = {

		/**
		 * A Layerset amelyikhez a réteg tartozik
		 * @private
		 * @type {Layerset}
		 */
		ownerSet : null,

		/**
		 * Kívánt pozíció a z-tengelyen
		 * @private
		 * @type {Number}
		 */
		zIndex : null,

		/**
		 * Pozíció a z-tengelyen (hézagmentes, automatikusan állítódik be)
		 * @type {Number}
		 */
		zAxis : 0,

		/**
		 * Láthatóság szabályozása
		 * @type {Boolean}
		 */
		hidden : false,

		/**
		 * Minden újrarajzoló művelet előtt végrehajtandó függvény
		 * @type {Function}
		 */
		subCommand : function(){},

		/**
		 * Újrarajzolás
		 * @returns {Layer}
		 */
		reDraw : function(){
			for (var n = 0; n < drawing.length; n++){
				this.subCommand.call(this);
				drawing[n].call(this);
			}
			return this;
		},

		/**
		 * Művelet beszúrása a sorba
		 * @param {Function} command műveletek
		 * @returns {Layer}
		 */
		push : function(command){
			drawing.push(command);
			return this;
		},

		/**
		 * Művelet beszúrása és végrehajtása
		 * @param {Function} command műveletek
		 * @returns {Layer}
		 */
		draw : function(command){
			drawing.push(command);
			this.ownerSet.reDraw();
			return this;
		},

		/**
		 * Réteg eltüntetése
		 * @returns {Layer}
		 */
		hide : function(){
			var canvas = this.ownerSet.canvas;
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.hidden = true;
			this.ownerSet.reDraw();
			return this;
		},

		/**
		 * Réteg megjelenítése
		 * @returns {Layer}
		 */
		show : function(){
			this.hidden = false;
			this.ownerSet.reDraw();
			return this;
		},

		/**
		 * Réteg leradírozása (ürítés, a drawing sor megmarad)
		 * @returns {Layer}
		 */
		erase : function(){
			var canvas = this.ownerSet.canvas;
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.ownerSet.reDraw();
			return this;
		},

		/**
		 * Réteg ürítése
		 * @returns {Layer}
		 */
		clear : function(){
			var canvas = this.ownerSet.canvas;
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawing = [];
			this.ownerSet.reDraw();
			return this;
		},

		/**
		 * Réteg törlése
		 * @returns {Layer}
		 */
		remove : function(){
			this.ownerSet.removeLayer(this);
			return this;
		},

		/**
		 * Réteg mozgatása a z-tengelyen
		 * @param {String} location mozgatás iránya ("down"|"up"|"bg"|"top")
		 * @param {Number} [num=1] down és up esetében a lépések száma
		 * @returns {Layer}
		 */
		move : function(location, num){
			this.ownerSet.moveLayer(this, location, num);
			return this;
		}

	};

	if (typeof subCommand === "function"){
		Interface.subCommand = subCommand;
	}
	if (typeof z !== "undefined"){
		Interface.zIndex = z;
	}

	return Interface;

};
