/* global appRoot */

'use strict';

var HD = require(`${appRoot}/libs/hd/hd.datetime.js`);

var Model = function(db){

	return {

		getUser : function(data, callback){
			const cursor = db.collection("chat_users").find({
				"username" : data.username,
				"password" : data.password
			}).limit(1);
			cursor.count(false)
				.then(function(num){
					if (num){
						cursor.forEach(function(doc){
							callback(doc);
						}, () => {});
					}
					else {
						callback(false);
					}
				});
		}

	};

};

module.exports = Model;
