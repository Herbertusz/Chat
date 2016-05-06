"use strict";

var CHAT = global.CHAT || {};

/**
 * Chat beállításai
 * @type Object
 */
CHAT.Config = {

	messageSend : {

		escapeHTML : true,
		replaceDisable : /`(.*)`/,
		emoticonReplacement : true,
		emoticons : {
			':)'       : '/images/emoticons/01.gif',
			':D'       : '/images/emoticons/02.gif',
			':]'       : '/images/emoticons/03.gif',
			'8)'       : '/images/emoticons/04.gif',
			';)'       : '/images/emoticons/05.gif',
			':?'       : '/images/emoticons/06.gif',
			'8|'       : '/images/emoticons/07.gif',
			'X('       : '/images/emoticons/08.gif',
			':('       : '/images/emoticons/09.gif',
			';('       : '/images/emoticons/10.gif',
			':like'    : '/images/emoticons/11.gif',
			':dislike' : '/images/emoticons/12.gif',
			':bug'     : '/images/emoticons/13.gif',
			':i'       : '/images/emoticons/14.gif',
			':w'       : '/images/emoticons/15.gif',
			':q'       : '/images/emoticons/16.gif',
			':alien'   : '/images/emoticons/17.gif'
		},
		bbCodeReplacement : true,
		bbCodes : [
			[/\*\*(.*?)\*\*/g,                 '<strong>$1</strong>'],
			[/__(.*?)__/g,                     '<em>$1</em>'],
			[/--(.*?)--/g,                     '<span style="text-decoration: line-through;">$1</span>'],
			[/\[color=(.*?)](.*?)\[\/color]/g, '<span style="color: $1;">$2</span>']
		],
		defaultSendMode : 'enter'  // 'enter'|'button'

	},

	fileTransfer : {

		allowed : true,
		store : 'upload',  // 'upload'|'base64'|'zip'
		multiple : true,
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
