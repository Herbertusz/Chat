/*!
 * HD-keret Slideshow v1.1.0
 * 2015.06.13.
 *
 * @description Slideshow-kezelő
 * @example
 *  // Beállítások
 *	var carousel = new HD.Site.Slideshow({
 *		items : '#slideshow .item',
 *		stepper : {
 *			left : $('#slideshow .step-left'),
 *			right : $('#slideshow .step-right')
 *		},
 *		jumpers : {
 *			elements : $('#slideshow .jump'),
 *			activeClass : "active"
 *		},
 *		timeout : 5000,
 *		cycle : true
 *	});
 *	// Beállítás felülírása
 *	carousel.options.default = function(){
 *		carousel.step("right");
 *	};
 *	// Effekt felülírása
 *	carousel.effect = function($itemfrom, $itemto){
 *		$itemfrom.hide();
 *		$itemto.show();
 *	};
 *	// Megállítás hover-re
 *	$('#slideshow .item').hover(function(){
 *		carousel.options.timeout = null;
 *	}, function(){
 *		carousel.options.timeout = 5000;
 *	});
 *	// Léptetés tetszőleges esemény hatására
 *	$('#reset-slideshow').click(function(){
 *		carousel.step(0);
 *	});
 *	// Indítás
 *	carousel.init();
 */

"use strict";

HD.Site = namespace("HD.Site");

/**
 * Slideshow objektum (Module minta)
 * @param {Object} options beállítások
 * @returns {Slideshow} felület
 */
HD.Site.Slideshow = function(options){

	/**
	 * Alapértelmezett beállítások
	 * @type {Object}
	 * @description szerkezet: {
	 *		items : String,				// Léptetendő elemek szelektora
	 *		stepper : {
	 *			left : jQuery,			// Balra léptető elem
	 *			right : jQuery			// Jobbra léptető elem
	 *		},
	 *		jumpers : {
	 *			elements : jQuery,		// Megadott sorszámú helyre léptető elemek
	 *			activeClass : String	// Aktív elem CSS class-a
	 *		},
	 *		default : Function,			// Alapértelmezett művelet
	 *		timeout : Number,			// A default metódus lefuttatásának periódusideje
	 *		cycle : Boolean,			// Ciklikus léptetés
	 *		dataItem : String,			// Elemek data-* attribútumának neve (névütközés esetén cserélhető)
	 *		dataJumper : String			// Jumperek data-* attribútumának neve (névütközés esetén cserélhető)
	 * }
	 */
	var defaultOptions = {
		items : '',
		stepper : {
			left : null,
			right : null
		},
		jumpers : {
			elements : null,
			activeClass : "active"
		},
		default : function(){},
		timeout : null,
		cycle : true,
		// DOM elemekhez kapcsolt adattárolók
		dataItem : "hd-site-slideshow-item",
		dataJumper : "hd-site-slideshow-jump"
	};

	/**
	 * Jelenleg látható slide
	 * @type {Number}
	 */
	var current = 0;

	/**
	 * Időzítő
	 * @type {Number}
	 */
	var timer = null;

	options = $.extend({}, defaultOptions, options);

	/**
	 * Jumper-ek létrehozása
	 * @param {Number} num
	 * @returns {jQuery} jumper-ek
	 */
	var setJumper = function(num){
		var $jumpers = options.jumpers.elements ? $(options.jumpers.elements) : null;
		var $activeJumper;
		if ($jumpers && $jumpers.length > 0){
			$jumpers.removeClass(options.jumpers.activeClass);
			if ($jumpers.data(options.dataJumper) !== undefined){
				$activeJumper = $jumpers.filter(':data(' + options.dataJumper + ',' + current + ')');
			}
			else {
				$activeJumper = $jumpers.eq(current);
			}
			$activeJumper.addClass(options.jumpers.activeClass);
		}
		return $jumpers;
	};

	/**
	 * Automatikus léptetés időzítőjének újraindítása
	 */
	var timerRestart = function(){
		window.clearTimeout(timer);
		if (!options.timeout) return;
		timer = window.setTimeout(function(){
			options.default();
		}, options.timeout);
	};

	/**
	 * Ciklikus DOM-mozgatás
	 * @param {jQuery} $itemfrom jelenleg aktív elem
	 * @param {jQuery} $itemto következő elem
	 */
	var cycling = function($itemfrom, $itemto){
		$(options.items).first().before($itemto);
		$(options.items).first().before($itemfrom);
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
		 * Léptető effekt
		 * @public
		 * @param {jQuery} $itemfrom jelenleg aktív elem
		 * @param {jQuery} $itemto következő elem
		 */
		effect : function($itemfrom, $itemto){
			$itemfrom.fadeOut(1000);
			$itemto.fadeIn(1000);
		},

		/**
		 * Slideshow léptetése
		 * @public
		 * @param {Number|String} loc pozíció ("left"|"right"|Number)
		 */
		step : function(loc){
			var $items = $(options.items);
			var itemnum = $items.length;
			var $itemfrom = $items.filter(':data(' + options.dataItem + ',' + current + ')');
			var $itemto = null;
			if (loc === "left"){
				current = (current + (itemnum - 1)) % itemnum;
			}
			else if (loc === "right"){
				current = (current + 1) % itemnum;
			}
			else {
				current = loc;
			}
			$itemto = $items.filter(':data(' + options.dataItem + ',' + current + ')');
			timerRestart();
			setJumper(current);
			if (options.cycle){
				cycling($itemfrom, $itemto);
			}
			Interface.effect($itemfrom, $itemto);
		},

		/**
		 * Slideshow alapértelmezett műveletének leállítása
		 * @public
		 */
		pause : function(){
			options.timeout = null;
			window.clearTimeout(timer);
		},

		/**
		 * Slideshow alapértelmezett műveletének folytatása
		 * @public
		 * @param {Number} t új timeout érték
		 */
		resume : function(t){
			options.timeout = t;
			timerRestart();
		},

		/**
		 * Slideshow létrehozása
		 * @public
		 */
		init : function(){
			var $items = $(options.items);
			var $stepperleft = options.stepper.left ? $(options.stepper.left) : null;
			var $stepperright = options.stepper.right ? $(options.stepper.right) : null;
			var $jumpers = setJumper(current);
			$items.each(function(index){
				$(this).data(options.dataItem, index);
			});
			if ($stepperleft && $stepperleft.length > 0){
				$stepperleft.click(function(){
					Interface.step("left");
				});
			}
			if ($stepperright && $stepperright.length > 0){
				$stepperright.click(function(){
					Interface.step("right");
				});
			}
			if ($jumpers && $jumpers.length > 0){
				$jumpers.click(function(){
					var num = 0;
					if ($jumpers.data(options.dataJumper) !== undefined){
						num = $(this).data(options.dataJumper);
					}
					else {
						num = $jumpers.index(this);
					}
					Interface.step(num);
				});
			}
			if (options.timeout){
				timerRestart();
			}
		}

	};

	return Interface;

};
