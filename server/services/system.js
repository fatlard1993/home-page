const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const Log = require(process.env.DIST ? `${__dirname}/../_log` : `${__dirname}/../../../swiss-army-knife/js/_log`);
const Cjs = require(process.env.DIST ? `${__dirname}/../_common` : `${__dirname}/../../../swiss-army-knife/js/_common`);

const Config = require(process.env.DIST ? `${__dirname}/config` : `${__dirname}/../../../symetrix-web-common/server/services/config`);

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
			httpPort: 8080,
			httpsPort: 443,
			startupBeep: 'beep -f 900 -r 2 -l 100 -d 20 -n -l 0 -D 200 -n',
			debugBeep: 'beep -f 1000 -r 5 -l 10 -n -f 600 -n 300'
		}
	},
	loadConfig: function(cb){
		Config.load({ path: path.join(__dirname, '..'), default: System.defaultConfig }, function(config){
			config.systemInfo.version = System.version;

			System.config = config;

			Log(1)('Loaded config!');

			Config.save(config, cb);
		});
	}
};

module.exports = System;