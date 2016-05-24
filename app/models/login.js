/* global appRoot */

'use strict';

var Model = function(db){

	return {

		getUser : function(data, callback){
			db.collection("chat_users")
				.find({
					"name" : data.username,
					"password" : data.password
				})
				.limit(1)
				.toArray()
				.then(function(docs){
					if (docs.length > 0){
						callback(docs[0]);
					}
					else {
						callback(false);
					}
				})
				.catch(function(error){
					console.log(error);
				});
		}

	};

};

module.exports = Model;
