const os = require('os');
const path = require('path');
const client = {
	http: require('http'),
	https: require('https')
};

const log = new (require('log'))({ tag: 'home-page' });
const Config = require('config-manager');
const SocketServer = require('websocket-server');

const homePage = {
	rootPath: function(){ return path.join(__dirname, '../..', ...arguments); },
	init: function(opts){
		this.bookmarks = new Config(path.resolve(os.homedir(), 'home-page.json'), { __sortOrder: [] });

		const { app } = require('http-server').init(opts.port, homePage.rootPath(), '/');

		require('./router');

		this.socketServer = new SocketServer({ server: app.server });
		this.socketServer.registerEndpoints(this.socketEndpoints);

		log.info('Loaded');
	},
	editBookmark: function(bookmark){
		var old = homePage.bookmarks.current[bookmark.old];

		log(`Changing bookmark: `, bookmark);

		homePage.bookmarks.current[bookmark.new.name || bookmark.old] = {
			url: bookmark.new.url || old.url,
			color: bookmark.new.color || old.color
		};

		if(bookmark.new.name && (bookmark.new.name !== bookmark.old)){
			if(old) delete homePage.bookmarks.current[bookmark.old];

			homePage.bookmarks.current.__sortOrder[homePage.bookmarks.current.__sortOrder.indexOf(bookmark.old)] = bookmark.new.name;
		}
	},
	updateOrder: function(order){
		homePage.bookmarks.current.__sortOrder = order;

		homePage.bookmarks.save();
	},
	getSearchSuggestions: function(keyword, done){
		log(3)(`Requesting suggestions for ${keyword}`);

		try{
			client.http.get(`http://suggestqueries.google.com/complete/search?client=chrome&q=${keyword}`, (res) => {
				if(res.statusCode !== 200){
					res.resume();

					return log.error(`Suggestion request failed with code: ${res.statusCode}`);
				}

				var data = '';

				res.setEncoding('utf8');

				res.on('data', (chunk) => { data += chunk; });

				res.on('end', () => {
					try{
						data = JSON.parse(data)[1].slice(0, 3);
					}
					catch(err){
						return done(err);
					}

					done(null, data);
				});
			}).on('error', (err) => {
				log.error(1)('Resource request error: ', err);
			});
		}
		catch(err){
			log.error('Suggestion request failed', err);

			done(err);
		}
	},
	socketEndpoints: {
		client_connect: function(){
			this.reply('bookmarks', homePage.bookmarks.current);
		},
		updateOrder: function(order){
			log(`update order: `, order);

			homePage.updateOrder(order);
		},
		addBookmark: function(bookmark){
			log(`Adding bookmark: `, bookmark);

			homePage.bookmarks.current[bookmark.name] = { url: bookmark.url, color: bookmark.color };

			homePage.bookmarks.current.__sortOrder.push(bookmark.name);

			homePage.socketServer.broadcast('bookmarks', homePage.bookmarks.current);

			homePage.bookmarks.save();
		},
		deleteBookmark: function(name){
			if(!homePage.bookmarks.current[name]) return;

			log(`Deleting bookmark: ${name}`);

			delete homePage.bookmarks.current[name];

			homePage.bookmarks.current.__sortOrder.splice(homePage.bookmarks.current.__sortOrder.indexOf(name), 1);

			homePage.socketServer.broadcast('bookmarks', homePage.bookmarks.current);

			homePage.bookmarks.save();
		},
		editBookmark: function(bookmark){
			homePage.editBookmark(bookmark);

			homePage.socketServer.broadcast('bookmarks', homePage.bookmarks.current);

			homePage.bookmarks.save();
		},
		editBookmarks: function(bookmarks){
			bookmarks.forEach(homePage.editBookmark);

			homePage.socketServer.broadcast('bookmarks', homePage.bookmarks.current);

			homePage.bookmarks.save();
		},
		getSearchSuggestions: function(keyword){
			homePage.getSearchSuggestions(keyword, (err, suggestions) => {
				if(err) return log.error(err);

				this.reply('search', { keyword, suggestions });
			});
		}
	}
};

module.exports = homePage;