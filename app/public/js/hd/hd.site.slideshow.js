/**
 * HD-keret Slideshow
 *
 * @description Slideshow-kezelő
 * @requires jQuery
 * @example
 *  // Beállítások
 *  const carousel = new HD.Site.Slideshow({
 *      items : '#slideshow .item',
 *      stepper : {
 *          left : $('#slideshow .step-left'),
 *          right : $('#slideshow .step-right')
 *      },
 *      jumpers : {
 *          elements : $('#slideshow .jump'),
 *          activeClass : 'active'
 *      },
 *      timeout : 5000,
 *      cycle : true
 *    });
 *  // Beállítás felülírása
 *  carousel.options.default = function(){
 *      carousel.step('right');
 *  };
 *  // Effekt felülírása
 *  carousel.effect = function($itemfrom, $itemto){
 *      $itemfrom.hide();
 *      $itemto.show();
 *  };
 *  // Megállítás hover-re
 *  $('#slideshow .item').hover(function(){
 *      carousel.options.timeout = null;
 *  }, function(){
 *      carousel.options.timeout = 5000;
 *  });
 *  // Léptetés tetszőleges esemény hatására
 *  $('#reset-slideshow').click(function(){
 *      carousel.step(0);
 *  });
 *  // Indítás
 *  carousel.init();
 */

'use strict';

var HD = window.HD || {};
HD.Site = HD.Site || {};

/**
 * Slideshow objektum (Module minta)
 * @param {Object} options - beállítások
 * @returns {Object} felület
 */
HD.Site.Slideshow = function(options){

    /**
     * Alapértelmezett beállítások
     * @type {Object}
     * @description
     *  defaultOptions = {
     *      items : String,           // Léptetendő elemek szelektora
     *      stepper : {
     *          left : jQuery,        // Balra léptető elem
     *          right : jQuery        // Jobbra léptető elem
     *      },
     *      jumpers : {
     *          elements : jQuery,    // Megadott sorszámú helyre léptető elemek
     *          activeClass : String  // Aktív elem CSS class-a
     *      },
     *      default : Function,       // Alapértelmezett művelet
     *      timeout : Number,         // A default metódus lefuttatásának periódusideje
     *      cycle : Boolean,          // Ciklikus léptetés
     *      dataItem : String,        // Elemek data-* attribútumának neve (névütközés esetén cserélhető)
     *      dataJumper : String       // Jumperek data-* attribútumának neve (névütközés esetén cserélhető)
     *  }
     */
    const defaultOptions = {
        items : '',
        stepper : {
            left : null,
            right : null
        },
        jumpers : {
            elements : null,
            activeClass : 'active'
        },
        default : function(){},
        timeout : null,
        cycle : true,
        // DOM elemekhez kapcsolt adattárolók
        dataItem : 'hd-site-slideshow-item',
        dataJumper : 'hd-site-slideshow-jump'
    };

    options = $.extend({}, defaultOptions, options);

    /**
     * Jelenleg látható slide
     * @type {Number}
     */
    let current = 0;

    /**
     * Időzítő
     * @type {Object}
     */
    let timer = null;

    /**
     * Jumper-ek létrehozása
     * @param {Number} num
     * @returns {jQuery} jumper-ek
     */
    const setJumper = function(num){
        let $activeJumper;
        const $jumpers = options.jumpers.elements ? $(options.jumpers.elements) : null;
        if ($jumpers && $jumpers.length > 0){
            $jumpers.removeClass(options.jumpers.activeClass);
            if (typeof $jumpers.data(options.dataJumper) !== 'undefined'){
                $activeJumper = $jumpers.filter(function(){
                    return $(this).data(options.dataJumper) === current;
                });
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
    const timerRestart = function(){
        window.clearTimeout(timer);
        if (!options.timeout) return;
        timer = setTimeout(function(){
            options.default();
        }, options.timeout);
    };

    /**
     * Ciklikus DOM-mozgatás
     * @param {jQuery} $itemfrom jelenleg aktív elem
     * @param {jQuery} $itemto következő elem
     */
    const cycling = function($itemfrom, $itemto){
        $(options.items).first().before($itemto);
        $(options.items).first().before($itemfrom);
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
         * @param {Number|String} loc - pozíció ('left'|'right'|Number)
         */
        step : function(loc){
            const $items = $(options.items);
            const itemnum = $items.length;
            const $itemfrom = $items.filter(function(){
                return $(this).data(options.dataItem) === current;
            });

            if (loc === 'left'){
                current = (current + (itemnum - 1)) % itemnum;
            }
            else if (loc === 'right'){
                current = (current + 1) % itemnum;
            }
            else {
                current = loc;
            }
            const $itemto = $items.filter(function(){
                return $(this).data(options.dataItem) === current;
            });
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
         * @param {Number} t - új timeout érték
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
            const $items = $(options.items);
            const $stepperleft = options.stepper.left ? $(options.stepper.left) : null;
            const $stepperright = options.stepper.right ? $(options.stepper.right) : null;
            const $jumpers = setJumper(current);

            $items.each(function(index, elem){
                $(elem).data(options.dataItem, index);
            });
            if ($stepperleft && $stepperleft.length > 0){
                $stepperleft.click(function(){
                    Interface.step('left');
                });
            }
            if ($stepperright && $stepperright.length > 0){
                $stepperright.click(function(){
                    Interface.step('right');
                });
            }
            if ($jumpers && $jumpers.length > 0){
                $jumpers.click(function(event){
                    let num = 0;
                    if (typeof $jumpers.data(options.dataJumper) !== 'undefined'){
                        num = $(event.target).data(options.dataJumper);
                    }
                    else {
                        num = $jumpers.index(event.target);
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
