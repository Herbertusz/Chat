"use strict";

/* global HD */

var CHAT = window.CHAT || {};

/**
 * Alkalmazásspecifikus függvények
 * @type Object
 */
CHAT.Method = {

	/**
	 * Felhasználói üzenet beszúrása
	 * @param {jQuery} $box
	 * @param {Object} data
	 * @param {Boolean} [highlighted=false]
	 * @description data szerkezete: {
	 *  	id : Number,
	 * 		message : String,
	 * 		time : Number,
	 * 		roomName : String
	 * }
	 */
	appendUserMessage : function($box, data, highlighted){
		var time = HD.DateTime.format('H:i:s', data.time);
		var $list = $box.find(CHAT.DOM.list);
		var userName = CHAT.Method.getUserName(data.id);
		highlighted = HD.Misc.funcParam(highlighted, false);
		$list.append(`
			<li>
				<span class="time">${time}</span>
				<strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
				<br />${CHAT.Util.escapeHtml(data.message)}
			</li>
		`);
		CHAT.Util.scrollToBottom($box);
	},

	/**
	 * Rendszerüzenet beszúrása
	 * @param {jQuery} $box
	 * @param {String} type
	 * @param {Number} userId
	 * @param {Number} [otherUserId]
	 */
	appendSystemMessage : function($box, type, userId, otherUserId){
		var $list = $box.find(CHAT.DOM.list);
		var userName = CHAT.Method.getUserName(userId);
		var otherUserName = CHAT.Method.getUserName(otherUserId);
		if (type === 'join'){
			$list.append(`
				<li class="highlighted">${userName} csatlakozott!</li>
			`);
		}
		else if (type === 'leave'){
			$list.append(`
				<li class="highlighted">${userName} kilépett!</li>
			`);
		}
		else if (type === 'forcejoinyou'){
			$list.append(`
				<li class="highlighted">${userName} hozzáadott ehhez a csatornához!</li>
			`);
		}
		else if (type === 'forcejoinother'){
			$list.append(`
				<li class="highlighted">${userName} hozzáadta ${otherUserName} felhasználót ehhez a csatornához!</li>
			`);
		}
		else if (type === 'forceleaveyou'){
			$list.append(`
				<li class="highlighted">${userName} kidobott!</li>
			`);
		}
		else if (type === 'forceleaveother'){
			$list.append(`
				<li class="highlighted">${userName} kidobta ${otherUserName} felhasználót!</li>
			`);
		}
		CHAT.Util.scrollToBottom($box);
	},

	/**
	 * Fájl beszúrása
	 * @param {jQuery} $box
	 * @param {Object} data
	 * @param {Boolean} [highlighted=false]
	 * @description data szerkezete: {
	 *  	id : Number,
	 * 		fileData : {
	 * 			name : String,
	 *  		size : Number,
	 *  		type : String
	 * 		},
	 * 		file : String,
	 * 		store : String,
	 * 		type : String,
	 * 		time : Number,
	 * 		roomName : String
	 * }
	 */
	appendFile : function($box, data, highlighted){
		var $element, $listItem, tpl, img, imgSrc;
		var time = HD.DateTime.format('H:i:s', data.time);
		var $list = $box.find(CHAT.DOM.list);
		var userName = CHAT.Method.getUserName(data.id);
		highlighted = HD.Misc.funcParam(highlighted, false);
		$listItem = $(`
			<li>
				<span class="time">${time}</span>
				<strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
				<br />
				<div class="filedisplay"></div>
			</li>
		`);
		if (data.type === "image"){
			imgSrc = data.file;
			tpl = `
				<a href="${data.file}" target="_blank">
					<img class="send-image" alt="${data.fileData.name}" src="${imgSrc}" />
				</a>
			`;
		}
		else {
			imgSrc = `/images/extensions/${data.type}.gif`;
			tpl = `
				<a href="${data.file}" target="_blank">
					<img alt="" src="${imgSrc}" />
					${data.fileData.name}
				</a>
			`;
		}
		img = document.createElement('img');
		img.onload = function(){
			$element = $(tpl);
			$listItem.find('.filedisplay').append($element);
			$list.append($listItem);
			CHAT.Util.scrollToBottom($box);
		};
		img.src = imgSrc;
	},

	/**
	 *
	 * @param $box
	 * @param direction
	 * @param percent
	 * @param newBar
	 */
	progressbar : function($box, direction, percent, newBar){
		var tpl;
		var $list = $box.find(CHAT.DOM.list);
		var label = direction === "send" ? 'Fájlküldés' : 'Fájlfogadás';
		newBar = HD.Misc.funcParam(newBar, false);
		tpl = `
			<li>
				<div class="progressbar">
					<span class="label">${label}...</span>
					<span class="linecontainer">
						<span class="line" style="width: ${percent}%"></span>
					</span>
					<span class="numeric">${percent}%</span>
				</div>
			</li>
		`;
		if (newBar){
			$list.append(tpl);
			CHAT.Util.scrollToBottom($box);
		}
		else {
			const $progressbar = $list.find('.progressbar').last();
			if (percent === 100){
				$progressbar.find('.label').html(`${label} befejeződött`);
				$progressbar.find('.line').addClass('finished');
			}
			$progressbar.find('.line').css("width", `${percent}%`);
			$progressbar.find('.numeric').html(`${percent}%`);
		}
	},

	/**
	 * Gépelés jelzése
	 * @param {jQuery} $box
	 * @param {Number} userId
	 */
	stillWrite : function($box, userId){
		var userName = CHAT.Method.getUserName(userId);
		$box.find(CHAT.DOM.indicator).html(`${userName} éppen ír...`);
	},

	/**
	 * Gépelés megállásának lekezelése
	 * @param {jQuery} $box
	 * @param {Number} userId
	 * @param {String} message
	 */
	stopWrite : function($box, userId, message){
		var userName = CHAT.Method.getUserName(userId);
		if (message.trim().length > 0){
			$box.find(CHAT.DOM.indicator).html(`${userName} szöveget írt be`);
		}
		else {
			$box.find(CHAT.DOM.indicator).html('');
		}
	},

	/**
	 * Hibaüzenetek kiírása
	 * @param {jQuery} $box
	 * @param {Array} errors
	 */
	showError : function($box, errors){ // TODO
		$box.find(CHAT.DOM.indicator).html(errors.join(", "));
		setTimeout(function(){
			$box.find(CHAT.DOM.indicator).html('');
		}, 4000);
	},

	/**
	 * Felhasználónév id alapján
	 * @param {Number} id
	 * @returns {String}
	 */
	getUserName : function(id){
		var $element = $(CHAT.DOM.onlineListItems).filter(`[data-id="${id}"]`);
		return $element.data("name");
	},

	/**
	 * Doboz tetején lévő felhasználólista létrehozása
	 * @param {jQuery} $to
	 * @param {Array} userIds
	 * @param {Boolean} [regenerate=false]
	 */
	generateUserList : function($to, userIds, regenerate){
		regenerate = HD.Misc.funcParam(regenerate, false);
		if (regenerate){
			$to.children(':not(.cloneable)').remove();
		}
		$(CHAT.DOM.onlineListItems).each(function(){
			var $user;
			var $this = $(this);
			var currentUserId = $this.data("id");
			if (userIds.indexOf(currentUserId) > -1){
				$user = CHAT.Util.cloneElement($to.find('.cloneable'), $to, currentUserId === CHAT.USER.id);
				$user.attr("data-id", currentUserId);
				$user.find('.status').addClass(CHAT.Method.getStatus($this)).addClass("run");
				$user.find('.name').html(CHAT.Method.getUserName(currentUserId));
			}
		});
	},

	/**
	 * Státuszjelző DOM-elem módosítása
	 * @param {jQuery} $elem
	 * @param {String} status
	 */
	setStatus : function($elem, status){
		var n;
		var $statusElem = $elem.find('.status');
		var statuses = ["on", "busy", "inv", "off"];
		if (status === "idle"){
			$statusElem.addClass("idle");
		}
		else {
			$statusElem.removeClass("idle");
			for (n = 0; n < statuses.length; n++){
				$statusElem.removeClass(statuses[n]);
			}
			$statusElem.addClass(status);
		}
	},

	/**
	 * Státuszjelző DOM-elem lekérdezése
	 * @param {jQuery} $elem
	 * @returns {String}
	 */
	getStatus : function($elem){
		var n, status;
		var $statusElem = $elem.find('.status');
		var statuses = ["on", "busy", "idle", "inv", "off"];
		for (n = 0; n < statuses.length; n++){
			if ($statusElem.hasClass(statuses[n])){
				status = statuses[n];
				break;
			}
		}
		return status;
	},

	/**
	 * Státuszok frissítése
	 * @param {Object} connectedUsers
	 */
	updateStatuses : function(connectedUsers){
		var socketId, isIdle;
		var onlineUserStatuses = {};
		for (socketId in connectedUsers){
			isIdle = connectedUsers[socketId].isIdle;
			onlineUserStatuses[connectedUsers[socketId].id] = isIdle ? "idle" : connectedUsers[socketId].status;
		}
		$(CHAT.DOM.onlineListItems).each(function(){
			var $this = $(this);
			var currentId = $this.data("id");
			if (typeof onlineUserStatuses[currentId] !== "undefined"){
				CHAT.Method.setStatus($this, onlineUserStatuses[currentId]);
			}
			else {
				CHAT.Method.setStatus($this, "off");
			}
		});
		$(CHAT.DOM.box).each(function(){
			$(this).find(CHAT.DOM.userItems).each(function(){
				var onlineStatus = onlineUserStatuses[$(this).attr("data-id")];
				CHAT.Method.setStatus($(this), onlineStatus || "off");
			});
		});
	},

	/**
	 * Felhasználó státuszának megváltoztatása
	 * @param {String} newStatus
	 * @returns {Object}
	 */
	changeCurrentStatus : function(newStatus){
		var socketId;
		var thisSocket = null;
		var connectedUsers = $(CHAT.DOM.online).data("connectedUsers");
		for (socketId in connectedUsers){
			if (connectedUsers[socketId].id === CHAT.USER.id){
				thisSocket = socketId;
				break;
			}
		}
		if (thisSocket){
			if (newStatus === "idle"){
				connectedUsers[thisSocket].isIdle = true;
			}
			else if (newStatus === "notidle"){
				connectedUsers[thisSocket].isIdle = false;
			}
			else {
				connectedUsers[thisSocket].isIdle = false;
				connectedUsers[thisSocket].status = newStatus;
			}
		}
		$(CHAT.DOM.online).data("connectedUsers", connectedUsers);
		return connectedUsers;
	},

	/**
	 * Doboz kitöltése DB-ből származó adatokkal
	 * @param {jQuery} $box
	 * @param {String} roomName
	 * @param {Function} [callback]
	 */
	fillBox : function($box, roomName, callback){
		callback = HD.Misc.funcParam(callback, function(){});
		$.ajax({
			type : "POST",
			url : "/chat/getroommessages",
			data : {
				roomName : roomName
			},
			dataType : "json",
			success : function(resp){
				/**
				 * @description resp : {
				 * 		messages : [
				 * 			0 : {
				 * 				messageId : Number,
				 *				userId : Number,
				 *				room : String,
				 *				fileId : Number,
				 *				message : String,
				 *				created : String,
				 *				fileName : String,
				 *				fileSize : Number,
				 *				fileType : String,
				 *				fileMainType : String,
				 *				fileStore : String,
				 *				fileBase64 : String,
				 *				fileZip : Array,
				 *				fileUrl : String,
				 *				fileData : String|Array
				 *				userName : String
				 *			},
				 *			...
				 *		]
				 * 	}
				 */
				resp.messages.forEach(function(msgData){
					var data;
					// FIXME: 2 óra csúszás!
					var timestamp = (new Date(msgData.created.replace(/ /g, 'T'))).getTime() / 1000;
					if (!msgData.fileId){
						CHAT.Method.appendUserMessage($box, {
							id : msgData.userId,
							time : timestamp,
							message : msgData.message,
							roomName : roomName
						});
					}
					else {
						data = {
							id : msgData.userId,
							fileData : {
								name : msgData.fileName,
								size : msgData.fileSize,
								type : msgData.fileType
							},
							file : null,
							type : msgData.fileMainType,
							time : timestamp,
							roomName : roomName
						};
						if (msgData.fileStore === 'base64'){
							data.file = msgData.fileBase64;
							CHAT.Method.appendFile($box, data);
						}
						else if (msgData.fileStore === 'upload'){
							data.file = msgData.fileUrl;
							CHAT.Method.appendFile($box, data);
						}
						else if (msgData.fileStore === 'zip'){
							msgData.fileZip.data.forEach(function(element, index, arr){
								arr[index] -= 128;
							});
							// FIXME: nem indul el a decompress
							CHAT.lzma.decompress(msgData.fileZip, function(file, error){
								console.log(data);
								if (error){
									console.log(error);
								}
								else {
									data.file = file;
									CHAT.Method.appendFile($box, data);
								}
							}, function(percent){
								console.log(percent);
								// TODO: progressbar
							});
						}
					}
				});
				callback();
			}
		});
	}

};
