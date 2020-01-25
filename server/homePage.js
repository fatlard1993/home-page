const path = require('path');

const log = require('log');
const Config = require('config-manager');
const SocketServer = require('websocket-server');

const homePage = {
	init: function(opts){
		this.config = new Config(path.join(opts.rootFolder, 'config.json'), {
			port: opts.port,
			bookmarks: {}
		});

		const { app, staticServer } = require('http-server').init(this.config.current.port, opts.rootFolder);

		this.socketServer = new SocketServer({ server: app.server });

		app.use('/resources', staticServer(path.join(opts.rootFolder, 'client/resources')));
		app.use('/fonts', staticServer(path.join(opts.rootFolder, 'client/fonts')));

		app.get('/home', (req, res, next) => { res.sendPage('index'); });

		this.socketServer.registerEndpoints(this.socketEndpoints);
	},
	socketEndpoints: {
		client_connect: function(){
			this.reply('bookmarks', homePage.config.current.bookmarks);
		},
		addBookmark: function(bookmark){
			log(`Adding bookmark: `, bookmark);

			homePage.config.current.bookmarks[bookmark.name] = bookmark.url;

			this.reply('bookmarks', homePage.config.current.bookmarks);

			homePage.config.save();
		},
		deleteBookmark: function(name){
			if(!homePage.config.current.bookmarks[name]) return;

			log(`Deleting bookmark: ${name}`);

			delete homePage.config.current.bookmarks[name];

			this.reply('bookmarks', homePage.config.current.bookmarks);

			homePage.config.save();
		},
		editBookmark: function(bookmark){
			log(`Changing bookmark: `, bookmark);

			homePage.config.current.bookmarks[bookmark.new.name || bookmark.old.name] = bookmark.new.url || bookmark.old.url;

			if(bookmark.new.name && homePage.config.current.bookmarks[bookmark.old.name]) delete homePage.config.current.bookmarks[bookmark.old.name];

			this.reply('bookmarks', homePage.config.current.bookmarks);

			homePage.config.save();
		}
	}
};

module.exports = homePage;