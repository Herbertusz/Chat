'use strict';

/* global appRoot */

var HD = require(appRoot + '/libs/hd/hd.datetime.js');
var DB = require(appRoot + '/app/models/dbconnect.js');

var Model = {

	getUsers : function(callback){
		DB.query(`
			SELECT
				*
			FROM\
				chat_users
			WHERE\
				active = 1
			ORDER BY\
				username ASC
		`, function(error, rows){
			if (error) throw error;
			rows.forEach(function(row, i){
				rows[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(row.created) / 1000));
			});
			callback.call(this, rows);
		});
	},

	getMessages : function(callback){
		DB.query(`
			SELECT
				cm.*,
				cu.username
			FROM
				chat_messages cm
				LEFT JOIN chat_users cu ON cm.user_id = cu.id
			ORDER BY
				cm.created ASC
		`, function(error, rows){
			if (error) throw error;
			rows.forEach(function(row, i){
				rows[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(row.created) / 1000));
			});
			callback.call(this, rows);
		});
	},

	getRoomMessages : function(roomName, callback){
		DB.query(`
			SELECT
				cm.id AS messageId,
				cm.user_id AS userId,
				cm.room,
				cm.file_id AS fileId,
				cm.message,
				cm.created,
				cf.name AS fileName,
				cf.size AS fileSize,
				cf.type AS fileType,
				cf.main_type AS fileMainType,
				cf.store AS fileStore,
				cf.base64 AS fileBase64,
				cf.zip AS fileZip,
				cf.url AS fileUrl,
				cu.username AS userName
			FROM
				chat_messages cm
				LEFT JOIN chat_files cf ON cm.file_id = cf.id
				LEFT JOIN chat_users cu ON cm.user_id = cu.id
			WHERE
				cm.room = :roomName
			ORDER BY
				cm.created ASC
		`, {
			roomName : roomName
		}, function(error, rows){
			if (error) throw error;
			rows.forEach(function(row, i){
				rows[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(row.created) / 1000));
			});
			callback.call(this, rows);
		});
	},

	setMessage : function(data, callback){
		var messageId;
		DB.insert('chat_messages', {
			'user_id' : data.userId,
			'room' : data.room,
			'file_id' : data.fileId,
			'message' : data.message,
			'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
		}, function(error, result){
			if (error) throw error;
			messageId = result.insertId;
			callback.call(this, messageId);
		});
	},

	setFile : function(data, callback){
		var This = this;
		var messageForFile = function(fdata, fileId){
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

		if (data.store === 'base64'){
			DB.insert('chat_files', {
				'name' : data.fileData.name,
				'size' : data.fileData.size,
				'type' : data.fileData.type,
				'main_type' : data.mainType,
				'store' : data.store,
				'base64' : data.file
			}, function(error, result){
				if (error) throw error;
				messageForFile(data, result.insertId);
			});
		}
		else if (data.store === 'upload'){
			DB.insert('chat_files', {
				'name' : data.fileData.name,
				'size' : data.fileData.size,
				'type' : data.fileData.type,
				'main_type' : data.mainType,
				'store' : data.store,
				'url' : data.file
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
				'store' : data.store
			}, function(error, result){
				if (error) throw error;
				messageForFile(data, result.insertId);
			});
		}
	}

};

module.exports = Model;
