/* global HD */

"use strict";

var CHAT = window.CHAT || {};

$(document).ready(function(){

	const $BOX = $(CHAT.DOM.box);

	// Csatorna létrehozása
	$(CHAT.DOM.start).click(function(){
		CHAT.Events.Client.createRoom();
		$(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
	});

	// Kilépés csatornából
	$BOX.find(CHAT.DOM.close).click(function(){
		CHAT.Events.Client.leaveRoom($(this).parents(CHAT.DOM.box));
	});

	// User hozzáadása csatornához
	$(CHAT.DOM.userSelect).change(function(){
		if ($(CHAT.DOM.selectedUsers).length > 0){
			$BOX.filter(':not([data-disabled])').find(CHAT.DOM.addUser).show();
		}
		else {
			$BOX.find(CHAT.DOM.addUser).hide();
		}
	});
	$BOX.find(CHAT.DOM.addUser).click(function(){
		const $add = $(this);
		$(CHAT.DOM.selectedUsers).each(function(){
			CHAT.Events.Client.forceJoinRoom($add, Number($(this).val()));
		});
		$(CHAT.DOM.userSelect).prop("checked", false).trigger("change");
	});

	// User kidobása csatornából
	$BOX.find(CHAT.DOM.userThrow).click(function(){
		CHAT.Events.Client.forceLeaveRoom($(this));
	});

	// Hibaüzenet eltüntetése
	$BOX.find(CHAT.DOM.errorClose).click(function(){
		$(this).parents(CHAT.DOM.box).find(CHAT.DOM.error).hide();
	});

	// Tétlen állapot
	$(CHAT.DOM.idleCheck).idleTimer(CHAT.timer.idle);
	$(CHAT.DOM.idleCheck).on("idle.idleTimer", function(){
		const connectedUsers = CHAT.Method.changeUserStatus("idle");
		CHAT.Method.updateStatuses(connectedUsers);
		CHAT.socket.emit('statusChanged', connectedUsers);
	});
	$(CHAT.DOM.idleCheck).on("active.idleTimer", function(){
		const connectedUsers = CHAT.Method.changeUserStatus("notidle");
		CHAT.Method.updateStatuses(connectedUsers);
		CHAT.socket.emit('statusChanged', connectedUsers);
	});

	// Státusz megváltoztatása
	$(CHAT.DOM.online).find(CHAT.DOM.statusChange).change(function(){
		const connectedUsers = CHAT.Method.changeUserStatus($(this).val());
		CHAT.Method.updateStatuses(connectedUsers);
		CHAT.socket.emit('statusChanged', connectedUsers);
	});

	// Üzenetküldés indítása ENTER leütésére
	$BOX.find(CHAT.DOM.message).keydown(function(event){
		const $box = $(this).parents('.chat');
		if (event.which === HD.Misc.keys.ENTER){
			if (!event.shiftKey && $box.find(CHAT.DOM.sendSwitch).prop("checked")){
				CHAT.Events.Client.sendMessage($box);
				event.preventDefault();
			}
		}
	});

	// Üzenetküldés indítása gombnyomásra
	$BOX.find(CHAT.DOM.sendButton).click(function(){
		const $box = $(this).parents('.chat');
		CHAT.Events.Client.sendMessage($box);
	});

	// Fájlküldés
	$BOX.find(CHAT.DOM.fileTrigger).click(function(){
		$(this).parents(CHAT.DOM.box).find(CHAT.DOM.file).trigger("click");
	});
	$BOX.find(CHAT.DOM.file).change(function(){
		const $box = $(this).parents('.chat');
		const files = $box.find(CHAT.DOM.file).get(0).files;
		if (files.length > 0){
			CHAT.Events.Client.sendFile($box, files);
		}
	});
	$BOX.on('click', 'a.notredirect', function(event){
		// event.preventDefault();
	});

	// Fájlküldés (drag-n-drop)
	$BOX.find(CHAT.DOM.dropFile).on(
		'drag dragstart dragend dragover dragenter dragleave drop',
		function(event){
			event.preventDefault();
			event.stopPropagation();
		}
	)
	.on('dragover dragenter', function(){
		$(this).addClass('drop-active');
	})
	.on('dragleave dragend drop', function(){
		$(this).removeClass('drop-active');
	})
	.on('drop', function(event){
		const $box = $(this).parents('.chat');
		const files = event.originalEvent.dataTransfer.files;
		CHAT.Events.Client.sendFile($box, files);
	});

	// Üzenet gépelése
	$BOX.find(CHAT.DOM.message).keyup(function(event){
		const $box = $(this).parents('.chat');
		if (event.which !== HD.Misc.keys.ENTER){
			CHAT.Events.Client.typeMessage($box);
		}
	});

	// Üzenetküldés módja
	$BOX.find(CHAT.DOM.sendSwitch).change(function(){
		CHAT.Events.Client.sendMethod($(this));
	});

	// User-sáv görgetése
	$BOX.find(CHAT.DOM.users).mousedown(function(){
		;
	});

	// Szerver által küldött események lekezelése
	let func;
	for (func in CHAT.Events.Server){
		CHAT.socket.on(func, CHAT.Events.Server[func]);
	}

});
