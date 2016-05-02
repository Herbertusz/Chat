/* global HD */

"use strict";

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
	 *  	userId : Number,
	 * 		message : String,
	 * 		time : Number,
	 * 		roomName : String
	 * }
	 */
	appendUserMessage : function($box, data, highlighted){
		const time = HD.DateTime.format('H:i:s', data.time);
		const $list = $box.find(CHAT.DOM.list);
		const userName = CHAT.Method.getUserName(data.userId);
		highlighted = HD.Misc.funcParam(highlighted, false);

		$list.append(`
			<li>
				<span class="time">${time}</span>
				<strong class="${highlighted ? "self" : ""}">${CHAT.Util.escapeHtml(userName)}</strong>:
				<br />${CHAT.Method.replaceMessage(data.message)}
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
		const $list = $box.find(CHAT.DOM.list);
		const userName = CHAT.Method.getUserName(userId);
		const otherUserName = CHAT.Method.getUserName(otherUserId);

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
	 *  	userId : Number,
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
		var $element, $listItem, tpl;
		var $list = $box.find(CHAT.DOM.list);
		let imgSrc;
		const time = HD.DateTime.format('H:i:s', data.time);
		const userName = CHAT.Method.getUserName(data.userId);
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
			imgSrc = `/images/filetypes/${data.type}.gif`;
			tpl = `
				<a href="${data.file}" target="_blank">
					<img alt="" src="${imgSrc}" />
					${data.fileData.name}
				</a>
			`;
		}

		const img = document.createElement('img');
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
	 * @param {jQuery} $box
	 * @param {String} direction
	 * @param {Number} percent
	 * @param {Number|null} barId - ha újat kell létrehozni, akkor null, egyébként egy létező progressbar id-ja
	 * @returns {Number|null}
	 */
	progressbar : function($box, direction, percent, barId){
		const $list = $box.find(CHAT.DOM.list);
		const label = (direction === "send") ? 'Fájlküldés' : 'Fájlfogadás';
		const tpl = `
			<li>
				<div class="progressbar" data-id="{BARID}">
					<span class="label">${label}...</span>
					<span class="linecontainer">
						<span class="line" style="width: ${percent}%"></span>
					</span>
					<span class="numeric">${percent}%</span>
				</div>
			</li>
		`;

		if (!barId){
			barId = HD.Number.getUniqueId();
			$list.append(tpl.replace("{BARID}", barId.toString()));
			CHAT.Util.scrollToBottom($box);
			return barId;
		}
		else {
			const $progressbar = $list.find('.progressbar').filter(`[data-id="${barId}"]`);
			if (percent === 100){
				$progressbar.find('.label').html(`${label} befejeződött`);
				$progressbar.find('.line').addClass('finished');
			}
			$progressbar.find('.line').css("width", `${percent}%`);
			$progressbar.find('.numeric').html(`${percent}%`);
			return null;
		}
	},

	/**
	 * Módosítások az elküldött szövegben
	 * @param {String} message
	 * @returns {String}
	 */
	replaceMessage : function(message){
		if (CHAT.Config.messageSend.escapeHTML){
			message = CHAT.Util.escapeHtml(message);
		}
		if (CHAT.Config.messageSend.emoticonReplacement){
			let icon;
			const emoticons = CHAT.Config.messageSend.emoticons;
			for (icon in emoticons){
				const escapedIcon = icon.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
				message.replace(new RegExp(escapedIcon, 'g'), `<img alt="${icon}" src="${emoticons[icon]}" />`);
			}
		}
		if (CHAT.Config.messageSend.bbCodeReplacement){
			;
		}
		return message;
	},

	/**
	 * Gépelés jelzése
	 * @param {jQuery} $box
	 * @param {Number} userId
	 */
	stillWrite : function($box, userId){
		const userName = CHAT.Method.getUserName(userId);
		$box.find(CHAT.DOM.indicator).html(`${userName} éppen ír...`);
	},

	/**
	 * Gépelés megállásának lekezelése
	 * @param {jQuery} $box
	 * @param {Number} userId
	 * @param {String} message
	 */
	stopWrite : function($box, userId, message){
		const userName = CHAT.Method.getUserName(userId);

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
	 * @param {Number} userId
	 * @returns {String}
	 */
	getUserName : function(userId){
		const $element = $(CHAT.DOM.onlineListItems).filter(`[data-id="${userId}"]`);
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
			let $user;
			const $this = $(this);
			const currentUserId = $this.data("id");
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
		let n;
		const $statusElem = $elem.find('.status');
		const statuses = ["on", "busy", "inv", "off"];

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
		let n, status;
		const $statusElem = $elem.find('.status');
		const statuses = ["on", "busy", "idle", "inv", "off"];

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
		var onlineUserStatuses = {};
		let socketId, isIdle;

		for (socketId in connectedUsers){
			isIdle = connectedUsers[socketId].isIdle;
			onlineUserStatuses[connectedUsers[socketId].id] = isIdle ? "idle" : connectedUsers[socketId].status;
		}
		$(CHAT.DOM.onlineListItems).each(function(){
			const $this = $(this);
			const currentId = $this.data("id");
			if (typeof onlineUserStatuses[currentId] !== "undefined"){
				CHAT.Method.setStatus($this, onlineUserStatuses[currentId]);
			}
			else {
				CHAT.Method.setStatus($this, "off");
			}
		});
		$(CHAT.DOM.box).each(function(){
			$(this).find(CHAT.DOM.userItems).each(function(){
				const onlineStatus = onlineUserStatuses[$(this).attr("data-id")];
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
		let socketId;
		let thisSocket = null;
		const connectedUsers = $(CHAT.DOM.online).data("connectedUsers");

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
					const timestamp = (new Date(msgData.created.replace(/ /g, 'T'))).getTime() / 1000; // FIXME: csúszás

					if (!msgData.fileId){
						CHAT.Method.appendUserMessage($box, {
							userId : msgData.userId,
							time : timestamp,
							message : msgData.message,
							roomName : roomName
						});
					}
					else {
						data = {
							userId : msgData.userId,
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
						CHAT.FileTransfer.action('receive', [$box, data, msgData]);
					}
				});
				callback();
			}
		});
	}

};