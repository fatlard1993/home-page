const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const Log = require(process.env.DIST ? `${__dirname}/../_log` : `${__dirname}/../../../swiss-army-knife/js/_log`);
const Cjs = require(process.env.DIST ? `${__dirname}/../_common` : `${__dirname}/../../../swiss-army-knife/js/_common`);

const Config = require(process.env.DIST ? `${__dirname}/config` : `${__dirname}/../../../swiss-army-knife/server/services/config`);

var System = {
	version: '0.1.dev',
	fs: {
		rm: function(file){ exec(`rm "${file}"`); },
		cat: function(file, cb){
			exec('cat '+ file, function(err, stdout, stderr){
				if(err) Log.error()('system.fs.cat', err);

				cb(stdout);
			});
		},
		rename: function(fileData, newName){
			exec(`mv "${fileData.path}${fileData.name}${fileData.ext}" "${fileData.path}${newName}${fileData.ext}"`);
		}
	},
	defaultConfig: {
		systemInfo: {
			version: ''
		},
		systemSettings: {
			port: 8080,
			bookmarks: {
				test: 'http://www.google.com',
				test2: 'http://www.google.com',
				test3: 'http://www.google.com',
				test4: 'http://www.google.com',
			}
		}
	},
	loadConfig: function(error, done){
		Config.load({ path: path.join(__dirname, '..'), default: System.defaultConfig }, error, function(config){
			config.systemInfo.version = System.version;

			System.config = config;

			Log(1)('Loaded config!');

			Config.save(config, error, done);
		});
	},
	saveConfig: function(config, error, done){
		Config.save(config || System.config, error || Log.error(), done);
	}
};

module.exports = System;