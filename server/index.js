#!/usr/bin/env node

import os from 'os';
import path from 'path';

import { Log } from 'log';
import argi from 'argi';

import homePage from './homePage.js';
import exit from './exit.js';

const { options } = argi.parse({
	verbosity: {
		type: 'number',
		alias: 'v',
		defaultValue: 1,
	},
	persistent: {
		type: 'boolean',
		alias: 'P',
		defaultValue: true,
		description: 'Save lists to a file',
	},
	database: {
		type: 'string',
		alias: 'd',
		defaultValue: path.join(os.homedir(), '.homePage.json'),
		description: 'Database json file to use',
	},
	port: {
		type: 'number',
		alias: 'p',
		defaultValue: 5033,
	},
});

const log = new Log({ tag: 'home-page', defaults: { verbosity: options.verbosity, color: true }, colorMap: { 'home-page': '\x1b[36m' } });

log(1)('Options', options);

homePage.init({ log, options });

exit.init({ log });
