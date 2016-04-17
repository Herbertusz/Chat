'use strict';

module.exports = function(app){

	app.locals.layout = {
		DOMAIN : global.DOMAIN,
		WSPORT : global.WSPORT,
		menu : [
			{
				text : 'Előszoba',
				url : '/'
			}, {
				text : 'Amőba',
				url : '/game'
			}, {
				text : 'Chat',
				url : '/chat'
			}
		]
	};

};
