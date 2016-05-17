'use strict';

var dbUrl;

const dbConn = {
	host : process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost',
	port : process.env.OPENSHIFT_MONGODB_DB_PORT || 27017,
	user : process.env.OPENSHIFT_MONGODB_DB_USERNAME || '',
	pass : process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '',
	app  : process.env.OPENSHIFT_APP_NAME || 'chat'
};

if (process.env.OPENSHIFT_APP_NAME){
	dbUrl = `mongodb://${dbConn.user}:${dbConn.pass}@${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}
else {
	dbUrl = `mongodb://${dbConn.host}:${dbConn.port}/${dbConn.app}`;
}

module.exports = dbUrl;
