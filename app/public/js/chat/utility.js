"use strict";

var CHAT = window.CHAT || {};

/**
 * Az aktuális kliensoldali user adatai
 * @type Object
 */
CHAT.USER = {
	id : userData.id,
	name : userData.name
};

/**
 * Socket objektum
 * @type Object
 */
CHAT.socket = io.connect('http://' + DOMAIN + ':' + WSPORT + '/chat');

/**
 * Tömörítés
 * @type {Object}
 */
CHAT.lzma = LZMA;

/**
 * jQuery szelektorok
 * @type Object
 */
CHAT.DOM = {
	idleCheck : 'body',
	start : '.online .start',
	online : '.online',
	onlineListItems : '.online li',
	onlineSelfListItem : '.online li.self',
	selfStatus : '.self .status',
	statusChange : '.status-change',
	userSelect : '.user-select',
	selectedUsers : '.user-select:checked',
	container : '.chatcontainer',
	cloneBox : '.chat.cloneable',
	box : '.chat',
	userItems : '.user-item',
	userThrow : '.throw',
	users : '.users',
	close : '.close',
	addUser : '.add-user',
	list : '.list',
	message : '.message',
	file : '.fileuploader .file',
	fileTrigger : '.fileuploader .trigger',
	dropFile : '.drop-file',
	indicator : '.indicator',
	sendButton : '.send',
	sendSwitch : '.send-switch'
};

/**
 * Időméréshez használt változók
 * @type Object
 */
CHAT.timer = {
	writing : {
		timerID : 0,
		interval : 1000,
		event : false,
		message : ''
	},
	drag : {
		timerID : 0,
		interval : 1000
	},
	drop : {
		timerID : 0,
		interval : 1000
	},
	idle : 300000
};

/**
 * Segédfüggvények
 * @type Object
 */
CHAT.Util = {

	/**
	 * HTML entitások cseréje
	 * @param {String} string
	 * @returns {String}
	 */
	escapeHtml : function(string){
		var str;
		var entityMap = {
			"&" : "&amp;",
			"<" : "&lt;",
			">" : "&gt;",
			'"' : '&quot;',
			"'" : '&#39;',
			"/" : '&#x2F;'
		};
		str = String(string).replace(/[&<>"'\/]/g, function(s){
			return entityMap[s];
		});
		str = str.replace(/\n/g, '<br />');
		return str;
	},

	/**
	 * Doboz scrollozása az aljára
	 * @param {jQuery} $box doboz
	 */
	scrollToBottom : function($box){
		var height = 0;
		var $list = $box.find(CHAT.DOM.list);
		$list.find('li').each(function(){
			height += $(this).outerHeight();
		});
		$list.scrollTop(height);
	},

	/**
	 * Elem rekurzív másolása eseménykezelőkkel együtt
	 * @param {jQuery} $element másolandó elem
	 * @param {jQuery} $insert beszúrás helye
	 * @param {Boolean} [prepend=false] ha true, beszúrás az elejére
	 * @returns {jQuery} az elem másolata
	 */
	cloneElement : function($element, $insert, prepend){
		prepend = HD.Misc.funcParam(prepend, false);
		var $clone = $element.clone(true, true);
		if (prepend){
			$clone.prependTo($insert);
		}
		else {
			$clone.appendTo($insert);
		}
		$clone.removeClass("cloneable");
		return $clone;
	}

};
