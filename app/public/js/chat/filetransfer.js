"use strict";

var CHAT = window.CHAT || {};

CHAT.FileTransfer = {

	strategies : {

		base64 : {
			send : function(){
				console.log('send - base64');
			},
			receive : function(){
				console.log('receive - base64');
			},
			display : function(){
				console.log('display - base64');
			}
		},

		upload : {
			send : function(){
				console.log('send - upload');
			},
			receive : function(){
				console.log('receive - upload');
			},
			display : function(){
				console.log('display - upload');
			}
		},

		zip : {
			send : function(){
				console.log('send - zip');
			},
			receive : function(){
				console.log('receive - zip');
			},
			display : function(){
				console.log('display - zip');
			}
		}

	},

	action : function(operation){
		const store = CHAT.Config.fileTransfer.store;

		if (this.strategies[store] && this.strategies[store][operation]){
			this.strategies[store][operation]();
		}
	}

};

CHAT.FileTransfer.action('send');
CHAT.FileTransfer.action('receive');
CHAT.FileTransfer.action('display');
