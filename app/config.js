"use strict";

var CHAT = global.CHAT || {};

/**
 * Chat beállításai
 * @type Object
 */
CHAT.Config = {
	messageSend : {
		escapeHTML : true,
		emoticonReplacement : false,
		emoticons : {
			':)' : '/images/emoticons/1.jpg',
			':D' : '/images/emoticons/2.jpg'
		},
		bbCodeReplacement : false,
		bbCodes : [
			['`(.*?)`',           false],
			['\\*\\*(.*?)\\*\\*', '<strong>$1</strong>'],
			['__(.*?)__',         '<em>$1</em>'],
			['--(.*?)--',         '<span style="text-decoration: line-through;">$1</span>']
		],
		defaultSendMode : 'enter'  // 'enter'|'button'
	},
	fileTransfer : {
		allowed : true,
		store : 'upload',  // 'upload'|'base64'|'zip'
		multiple : false,
		types : {
			image : /^image\/.*$/,
			text  : /^(text\/.*|.*javascript|.*ecmascript)$/,
			pdf   : /^application\/pdf$/,
			doc   : /^.*(msword|ms-word|wordprocessingml).*/,
			xls   : /^.*(ms-excel|spreadsheetml).*$/,
			ppt   : /^.*(ms-powerpoint|presentationml).*$/,
			zip   : /^.*(zip|compressed).*$/,
			audio : /^audio\/.*$/,
			video : /^video\/.*$/,
			exec  : /^application\/(octet-stream|x-msdownload|(x-|dos-|x-win)?exe|msdos-windows|x-msdos-program)$/,
			file  : /^.*$/
		},
		allowedTypes : ["image", "text", "pdf", "doc", "xls", "ppt", "zip", "audio", "video", "exec", "file"],
		maxSize : 100 * 1024 * 1024
	}
};

exports.Config = CHAT.Config;
