"use strict";

var CHAT = window.CHAT || {};

/**
 * Chat beállításai
 * @type Object
 */
CHAT.Config = {
	fileTransfer : {
		allowed : true,
		store : 'upload',  // 'base64'|'upload'|'zip'
		multiple : false,
		types : {
			image : {tag : "img", attr : "src"},
			file : {tag : "a", attr : "href"}
		},
		extensions : {
			image : /^image\/.*$/,
			text  : /^(text\/.*|.*javascript|.*ecmascript)$/,
			pdf   : /^application\/pdf$/,
			doc   : /^.*(msword|ms-word|wordprocessingml).*/,
			xls   : /^.*(ms-excel|spreadsheetml).*$/,
			ppt   : /^.*(ms-powerpoint|presentationml).*$/,
			zip   : /^.*(zip|compressed).*$/,
			audio : /^audio\/.*$/,
			video : /^video\/.*$/,
			exec  : /^application\/octet-stream$/,
			file  : /^.*$/
		},
		allowedTypes : ["image", "text", "pdf", "doc", "xls", "ppt", "zip", "audio", "video", "exec", "file"],
		maxSize : 100 * 1024 * 1024
	}
};
