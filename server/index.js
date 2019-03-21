#!/usr/bin/env node

const path = require('path');

const findRoot = require('find-root');
const rootFolder = findRoot(__dirname);

process.chdir(rootFolder);

const args = require('yargs').argv;
const log = require('log');
const Config = require('config-manager');

var config = new Config(path.join(rootFolder, 'config.json'), {
	port: 8080,
	bookmarks: {}
});

const { app, sendPage, pageCompiler, staticServer } = require('http-server').init(args.port || config.current.port, rootFolder);
const SocketServer = require('websocket-server');

const socketServer = new SocketServer({ server: app.server });

pageCompiler.buildFile('index');

app.get('/testj', function(req, res){
	log('Testing JSON...');

	res.json({ test: 1 });
});

app.get('/test', function(req, res){
	log('Testing...');

	res.send('test');
});

app.use('/resources', staticServer(path.join(rootFolder, 'client/resources')));

app.use('/fonts', staticServer(path.join(rootFolder, 'client/fonts')));

app.get('/home', sendPage('index'));

socketServer.registerEndpoints({
	client_connect: function(){
		this.reply('bookmarks', config.current.bookmarks);
	},
	addBookmark: function(bookmark){
		log(`Adding bookmark: `, bookmark);

		config.current.bookmarks[bookmark.name] = bookmark.url;

		this.reply('bookmarks', config.current.bookmarks);

		config.save();
	},
	deleteBookmark: function(name){
		if(!config.current.bookmarks[name]) return;

		log(`Deleting bookmark: ${name}`);

		delete config.current.bookmarks[name];

		this.reply('bookmarks', config.current.bookmarks);

		config.save();
	},
	editBookmark: function(bookmark){
		log(`Changing bookmark: `, bookmark);

		config.current.bookmarks[bookmark.new.name] = bookmark.new.url;

		if(config.current.bookmarks[bookmark.old.name]) delete config.current.bookmarks[bookmark.old.name];

		this.reply('bookmarks', config.current.bookmarks);

		config.save();
	}
});