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
					console.log(error);
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
			let messageId, insertData;
			if (data.message){
				insertData = {
					'userId' : data.userId,
					'room' : data.room,
					'message' : data.message,
					'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
				};
			}
			else if (data.file){
				insertData = {
					'userId' : data.userId,
					'room' : data.room,
					'file' : data.file,
					'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
				};
			}
			db.collection("chat_messages")
				.insertOne(insertData)
				.then(function(result){
					messageId = result.insertedId;
					callback(messageId);
				})
				.catch(function(error){
					console.log(error);
				});
		},

		setFile : function(data, callback){
			this.setMessage({
				'userId' : data.userId,
				'room' : data.room,
				'file' : {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'mainType' : data.mainType,
					'store' : data.store,
					'data' : data.file,
					'deleted' : false
				},
				'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
			}, function(messageId){
				callback(messageId);
			});
		},

		deleteFile : function(roomName, callback){
			db.collection("chat_messages")
				.find({"$and" : [
					{"room" : roomName},
					{"file" : {"$exists" : true}},
					{"file.store" : "upload"}
				]}, {
					"file" : 1
				})
				.toArray()
				.then(function(docs){
					const urls = [];
					docs.forEach(function(doc){
						urls.push(doc.file.data);
						db.collection("chat_messages")
							.updateOne({
								"_id" : doc._id
							}, {
								"$set" : {
									"file.deleted" : true
								}
							});
					});
					callback(urls);
				})
				.catch(function(error){
					console.log(error);
				});
		}

	};

};

module.exports = Model;
