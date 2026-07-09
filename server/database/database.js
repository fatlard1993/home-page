import fs from 'fs';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const database = {
	_writeQueue: Promise.resolve(),
	default: {
		bookmarks: {},
		categories: {},
		searchEngines: {},
	},
	async init({ path }) {
		let resolvedPath = path;

		try {
			resolvedPath = fs.realpathSync(path);
		} catch {
			// path doesn't exist yet (first run) or isn't a symlink, use as-is
		}

		database.db = new Low(new JSONFile(resolvedPath), database.default);

		await database.db.read();

		database.db.data = { ...database.default, ...(database.db.data || {}) };

		await database.db.write();
	},
	write() {
		database._writeQueue = database._writeQueue
			.catch(() => {}) // Clear previous rejection so queue continues
			.then(() => database.db.write())
			.catch(error => {
				console.error('Database write failed:', error);
				throw error;
			});

		return database._writeQueue;
	},
};

export default database;

