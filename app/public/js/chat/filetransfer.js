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
		base64 : {

			/**
			 *
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
			 */
			clientSend : function($box, data, reader, rawFile){
				// base64 tárolása db-ben
				data.file = reader.result;
				CHAT.Method.appendFile($box, data, true);
				CHAT.socket.emit('sendFile', data);
			},

			/**
			 *
			 * @param $box
			 * @param data
			 */
			serverSend : function($box, data){
				CHAT.Method.appendFile($box, data);
			},

			/**
			 *
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
		upload : {

			/**
			 *
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
			 */
			clientSend : function($box, data, reader, rawFile){
				// fájlfeltöltés, url tárolása db-ben
				const fileData = JSON.stringify(data);
				const xhr = new XMLHttpRequest();
				xhr.open("POST", "/chat/uploadfile");
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.setRequestHeader('X-File-Data', encodeURIComponent(fileData));
				xhr.setRequestHeader('Content-Type', 'application/octet-stream');
				CHAT.Method.progressbar($box, "send", 0, true);
				xhr.upload.onprogress = function(event){
					if (event.lengthComputable){
						const percent = event.loaded / event.total;
						CHAT.Method.progressbar($box, "send", Math.round(percent * 100));
					}
				};
				xhr.onload = function(){
					const response = JSON.parse(xhr.responseText);
					data.file = response.filePath;
					CHAT.Method.progressbar($box, "send", 100);
					CHAT.Method.appendFile($box, data, true);
					CHAT.socket.emit('sendFile', data);
				};
				xhr.send(rawFile);
			},

			/**
			 *
			 * @param $box
			 * @param data
			 */
			serverSend : function($box, data){
				CHAT.Method.appendFile($box, data);
			},

			/**
			 *
			 * @param $box
			 * @param data
			 * @param msgData
			 */
			receive : function($box, data, msgData){
				data.file = msgData.fileUrl;
				CHAT.Method.appendFile($box, data);
			}

		},

		/**
		 *
		 * @type Object
		 */
		zip : {

			/**
			 *
			 * @param $box
			 * @param data
			 * @param reader
			 * @param rawFile
			 */
			clientSend : function($box, data, reader, rawFile){
				// tömörített base64 tárolása db-ben
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
