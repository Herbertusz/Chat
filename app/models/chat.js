/* global appRoot */

'use strict';

var HD = require(`${appRoot}/libs/hd/hd.datetime.js`);

var Model = function(db){

	return {

		getUsers : function(callback){
			db.collection("chat_users")
				.find({"active" : true})
				.sort({"name" : 1})
				.toArray()
				.then(function(users){
					users.forEach(function(user, i){
						users[i].created = HD.DateTime.formatMS('Y-m-d H:i:s', user.created);
					});
					callback(users);
				})
				.catch(function(error){
					console.log(error.name);
					console.log(error.message);
				});
		},

		getRoomMessages : function(roomName, callback){
			db.collection("chat_messages")
				.find({"room" : roomName})
				.sort({"created" : 1})
				.toArray()
				.then(function(messages){
					const promises = [];
					messages.forEach(function(message){
						promises.push(
							new Promise(function(resolve){
								db.collection("chat_users")
									.find({"id" : message.userId})
									.limit(1)
									.toArray()
									.then(function(users){
										message.userName = users.length ? users[0].name : '';
										resolve(message);
									});
							})
						);
					});
					return Promise.all(promises);
				})
				.then(function(messages){
					callback(messages);
				})
				.catch(function(error){
					console.log(error);
				});
		},

		setMessage : function(data, callback){
			let messageId;
			db.collection("chat_messages")
				.insertOne({
					'userId' : data.userId,
					'room' : data.room,
					'file_id' : data.fileId,
					'message' : data.message,
					'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
				})
				.then(function(result){
					messageId = result.insertedId;
					callback(messageId);
				})
				.catch(function(error){
					console.log(error);
				});
		}
/*
		setFile : function(data, callback){
			const This = this;
			const messageForFile = function(fdata, fileId){
				This.setMessage({
					'userId' : fdata.userId,
					'room' : fdata.room,
					'fileId' : fileId,
					'message' : null,
					'created' : HD.DateTime.format('Y-m-d H:i:s', fdata.time)
				}, function(messageId){
					callback.call(this, fileId, messageId);
				});
			};

			if (data.store === 'upload'){
				DB.insert('chat_files', {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'url' : data.file,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
			else if (data.store === 'base64'){
				DB.insert('chat_files', {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'base64' : data.file,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
			else if (data.store === 'zip'){
				data.file.forEach(function(element, index, arr){
					arr[index] += 128;
				});
				DB.query(`
					INSERT INTO chat_files
					(name, size, type, main_type, store, zip) VALUES
					(:name, :size, :type, :main_type, :store, CHAR(${data.file}))
				`, {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
		},

		deleteFile : function(roomName, callback){
			DB.query(`
				SELECT
					cf.id AS id,
					cf.url AS fileUrl
				FROM
					chat_messages cm
					LEFT JOIN chat_files cf ON cm.file_id = cf.id
				WHERE
					cm.room = :roomName
			`, {
				roomName : roomName
			}, function(error, rows){
				if (error) throw error;
				const urls = [];
				rows.forEach(function(row){
					urls.push(row.fileUrl);
					DB.query(`
						UPDATE
							chat_files
						SET
							deleted = 1
						WHERE
							id = :id
					`, {
						id : row.id
					});
				});
				callback.call(this, urls);
			});
		}
*/

	};

};

module.exports = Model;
