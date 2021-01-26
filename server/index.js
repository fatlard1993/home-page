#!/usr/bin/env node

const argi = require('argi');
const rootFolder = require('find-root')(__dirname);

argi.parse({
	verbosity: {
		type: 'int',
		alias: 'v',
		defaultValue: 1
	},
	rootFolder: {
		type: 'string',
		alias: 'r',
		defaultValue: rootFolder
	},
	port: {
		type: 'int',
		alias: 'p',
		defaultValue: 80
	}
});

process.chdir(rootFolder);

const options = argi.options.named;
const log = new (require('log'))({ tag: 'home-page', color: true, defaultVerbosity: options.verbosity });

log(1)('Options', options);

require('./homePage').init(options);