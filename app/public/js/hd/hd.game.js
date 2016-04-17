/*!
 * HD-keret Game v1.0.0
 * 2015.02.21.
 *
 * @description Általános JS játékkezelő
 */

"use strict";

HD.Game = namespace("HD.Game");

/**
 * Canvas 2D alapú játék
 * @param {String} selector a canvas elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.Canvas2D = function(selector, gameStartFunc){

	var This = HD.Game;
	This.canvas = document.querySelector(selector);
	This.originalWidth = This.canvas.width;
	This.originalHeight = This.canvas.height;
	This.ctx = This.canvas.getContext("2d");
	gameStartFunc.call(This);

};

/**
 * Canvas 3D alapú játék
 * @param {String} selector a canvas elem szelektora
 * @param {Function} gameStartFunc játék indítása
 * @param {Function} [gameFallbackFunc=function(){}] fallback
 */
HD.Game.Canvas3D = function(selector, gameStartFunc, gameFallbackFunc){

	if (typeof gameFallbackFunc === "undefined") gameFallbackFunc = function(){};

	var This = HD.Game;
	This.canvas = document.querySelector(selector);
	This.originalWidth = This.canvas.width;
	This.originalHeight = This.canvas.height;
	try {
		This.gl = This.canvas.getContext("webgl") || This.canvas.getContext("experimental-webgl");
	}
	catch (e){}

	if (This.gl){
		gameStartFunc.call(This);
	}
	else {
		gameFallbackFunc.call(This);
	}

};

/**
 * SVG alapú játék
 * @param {String} selector az svg elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.SVG = function(selector, gameStartFunc){

	var This = HD.Game;
	This.svg = document.querySelector(selector);
	gameStartFunc.call(This);

};

/**
 * DOM alapú játék (pl. div, table, ...)
 * @param {String} selector a DOM elem szelektora
 * @param {Function} gameStartFunc játék indítása
 */
HD.Game.DOM = function(selector, gameStartFunc){

	var This = HD.Game;
	This.node = document.querySelector(selector);
	gameStartFunc.call(This);

};
