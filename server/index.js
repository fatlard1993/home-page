#!/usr/bin/env node

import os from 'os';
import path from 'path';

import express from 'express';

import argi from 'argi';

import database from './database/index.js';
import router from './router/index.js';
import exit from './exit.js';

import { PORT } from '../constants.js';

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
		defaultValue: PORT,
	},
});

console.log('Options', options);

const app = express();

app.listen(options.port, () => console.log(`Server listening on port: ${options.port}`));

router.init({ express, app });

database.init({ persistent: options.persistent, path: options.database });

exit.init();
