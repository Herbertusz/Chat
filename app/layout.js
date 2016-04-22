'use strict';

module.exports = function(app){

	app.locals.layout = {
		DOMAIN : global.DOMAIN,
		WSPORT : global.WSPORT,
		menu : [
			{
				text : 'Előszoba',
				url : '/'
			},
			{
				text : 'Chat',
				url : '/chat'
			}
		]
	};

};
