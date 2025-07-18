#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi';

import database from './database';
import server, { spawnBuild } from './server';

import './exit';

const { options } = new Argi({
	options: {
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
			defaultValue: 8033,
		},
	},
});

console.log('Options', options, process.env.NODE_ENV);

database.init({ persistent: options.persistent, path: options.database });

server.init({ port: options.port });

if (process.env.NODE_ENV === 'development') {
	try {
		for await (const line of console) {
			if ({ stop: 1, close: 1, exit: 1 }[line]) process.kill(process.pid, 'SIGTERM');
			else if (line === 'b') {
				console.log('>> Building...');
				spawnBuild();
			}
		}
	} catch (error) {
		console.error('Build Error', error);
	}
}
