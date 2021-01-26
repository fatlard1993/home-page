#!/usr/bin/env node

const argi = require('argi');

argi.parse({
	verbosity: {
		type: 'int',
		alias: 'v',
		defaultValue: 1
	},
	port: {
		type: 'int',
		alias: 'p',
		defaultValue: 80
	}
});

const options = argi.options.named;
const log = new (require('log'))({ tag: 'home-page', defaults: { verbosity: options.verbosity, color: true } });

log(1)('Options', options);

require('./homePage').init(options);