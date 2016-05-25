"use strict";

var CHAT = window.CHAT || {};

/**
 *
 * @type Object
 */
CHAT.FileTransfer = {

	/**
	 *
	 * @type Object
	 */
	strategies : {

		/**
		 *
		 * @type Object
		 */
		upload : {

			/**
			 * Fájlfeltöltés, url tárolása db-ben
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
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
			clientSend : function($box, data, reader, rawFile){
				const fileData = JSON.stringify(data);
				const xhr = new XMLHttpRequest();
				xhr.open("POST", "/chat/uploadfile");
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.setRequestHeader('X-File-Data', encodeURIComponent(fileData));
				xhr.setRequestHeader('Content-Type', 'application/octet-stream');
				const barId = CHAT.Method.progressbar($box, "send", 0, null);
				xhr.upload.onprogress = function(event){
					if (event.lengthComputable){
						const percent = event.loaded / event.total;
						CHAT.Method.progressbar($box, "send", Math.round(percent * 100), barId);
					}
				};
				xhr.onload = function(){
					const response = JSON.parse(xhr.responseText);
					data.file = response.filePath;
					CHAT.Method.progressbar($box, "send", 100, barId);
					CHAT.Method.appendFile($box, data, true);
					CHAT.socket.emit('sendFile', data);
				};
				xhr.send(rawFile);
			},

			/**
			 *
			 * @param $box
			 * @param data
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
			serverSend : function($box, data){
				CHAT.Method.appendFile($box, data);
			},

			/**
			 *
			 * @param $box
			 * @param data
			 * @param msgData
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
			receive : function($box, data, msgData){
				data.file = msgData.file.data;
				if (!data.fileData.deleted){
					CHAT.Method.appendFile($box, data);
				}
				else {
					CHAT.Method.appendDeletedFile($box, data);
				}
			}

		},

		/**
		 * Base64 kód tárolása db-ben
		 * @type Object
		 */
		base64 : {

			/**
			 * Fájlküldés
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
			 */
			clientSend : function($box, data, reader, rawFile){
				data.file = reader.result;
				CHAT.Method.appendFile($box, data, true);
				CHAT.socket.emit('sendFile', data);
			},

			/**
			 * Fájlfogadás
			 * @param $box
			 * @param data
			 */
			serverSend : function($box, data){
				CHAT.Method.appendFile($box, data);
			},

			/**
			 * Korábban küldött fájl fogadása
			 * @param $box
			 * @param data
			 * @param msgData
			 */
			receive : function($box, data, msgData){
				data.file = msgData.fileBase64;
				CHAT.Method.appendFile($box, data);
			}

		},

		/**
		 *
		 * @type Object
		 */
		zip : {

			/**
			 * Tömörített base64 kód tárolása db-ben
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
			 */
			clientSend : function($box, data, reader, rawFile){
				CHAT.lzma.compress(reader.result, 1, function(result, error){
					if (error){
						console.log(error);
					}
					else {
						data.file = result;
					}
					CHAT.Method.appendFile($box, data, true);
					CHAT.socket.emit('sendFile', data);
				}, function(percent){
					// TODO: progressbar
				});
			},

			/**
			 *
			 * @param $box
			 * @param data
			 */
			serverSend : function($box, data){
				CHAT.lzma.decompress(data.file, function(result, error){
					if (error){
						console.log(error);
					}
					else {
						data.file = result;
						CHAT.Method.appendFile($box, data);
					}
				}, function(percent){
					// TODO: progressbar
				});
			},

			/**
			 *
			 * @param $box
			 * @param data
			 * @param msgData
			 */
			receive : function($box, data, msgData){
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

	},

	/**
	 *
	 * @param operation
	 * @param args
	 */
	action : function(operation, args){
		const store = CHAT.Config.fileTransfer.store;

		if (this.strategies[store] && this.strategies[store][operation]){
			this.strategies[store][operation](...args);
		}
	}

};
