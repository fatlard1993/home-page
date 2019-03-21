#!/usr/bin/env node

const path = require('path');

const args = require('yargs').argv;
const log = require('log');
const ConfigManager = require('config-manager');
const findRoot = require('find-root');

const rootFolder = findRoot(process.cwd());

var config = new ConfigManager(path.join(rootFolder, 'config.json'), {
	port: 8080,
	bookmarks: {}
});

const { app, sendPage, pageCompiler, staticServer } = require('http-server').init(args.port || config.current.port);
const SocketServer = require('websocket-server');

const socketServer = new SocketServer({ server: app.server });
const stdin = process.openStdin();

pageCompiler.buildFile('home');

app.get('/testj', function(req, res){
	log('Testing JSON...');

	res.json({ test: 1 });
});

app.get('/test', function(req, res){
	log('Testing...');

	res.send('test');
});

app.use('/resources', staticServer(path.join(__dirname, '../client/resources')));

app.use('/fonts', staticServer(path.join(__dirname, '../client/fonts')));

app.get('/home', sendPage('home'));

socketServer.registerEndpoints({
	open: function(){
		this.reply('bookmarks', config.current.bookmarks);
	},
	addBookmark: function(bookmark){
		log(`Adding bookmark: `, bookmark);

		config.current.bookmarks[bookmark.name] = bookmark.url;

		this.reply('bookmarks', config.current.bookmarks);
	},
	deleteBookmark: function(name){
		if(!config.current.bookmarks[name]) return;

		log(`Deleting bookmark: ${name}`);

		delete config.current.bookmarks[name];

		this.reply('bookmarks', config.current.bookmarks);
	},
	editBookmark: function(bookmark){
		log(`Changing bookmark: `, bookmark);

		config.current.bookmarks[bookmark.new.name] = bookmark.new.url;

		if(config.current.bookmarks[bookmark.old.name]) delete config.current.bookmarks[bookmark.old.name];

		this.reply('bookmarks', config.current.bookmarks);
	}
});

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	log(`CMD: ${cmd}`);
});