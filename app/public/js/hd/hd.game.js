/*!
 * HD-keret Game v1.0.0
 * 2015.02.21.
 *
 * @description Általános JS játékkezelő
 */

/* global HD namespace */

"use strict";

HD.Game = namespace("HD.Game");

/**
 * Canvas 2D alapú játék
 * @param {String} selector a canvas elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.Canvas2D = function(selector, gameStartFunc){

    var Game = HD.Game;
    Game.canvas = document.querySelector(selector);
    Game.originalWidth = Game.canvas.width;
    Game.originalHeight = Game.canvas.height;
    Game.ctx = Game.canvas.getContext("2d");
    gameStartFunc.call(Game);

};

/**
 * Canvas 3D alapú játék
 * @param {String} selector a canvas elem szelektora
 * @param {Function} gameStartFunc játék indítása
 * @param {Function} [gameFallbackFunc=function(){}] fallback
 */
HD.Game.Canvas3D = function(selector, gameStartFunc, gameFallbackFunc){

    var Game = HD.Game;
    if (typeof gameFallbackFunc === "undefined") gameFallbackFunc = function(){};

    Game.canvas = document.querySelector(selector);
    Game.originalWidth = Game.canvas.width;
    Game.originalHeight = Game.canvas.height;
    try {
        Game.gl = Game.canvas.getContext("webgl") || Game.canvas.getContext("experimental-webgl");
    }
    catch (e){}

    if (Game.gl){
        gameStartFunc.call(Game);
    }
    else {
        gameFallbackFunc.call(Game);
    }

};

/**
 * SVG alapú játék
 * @param {String} selector az svg elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.SVG = function(selector, gameStartFunc){

    var Game = HD.Game;
    Game.svg = document.querySelector(selector);
    gameStartFunc.call(Game);

};

/**
 * DOM alapú játék (pl. div, table, ...)
 * @param {String} selector a DOM elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.DOM = function(selector, gameStartFunc){

    var Game = HD.Game;
    Game.node = document.querySelector(selector);
    gameStartFunc.call(Game);

};
