import fs from 'fs';
import path from 'path';

import { openDatabase } from '@vanilla-bean/components/app';

// The stores are made at import and read this lazily, so they work once init has run
const database = {
	_writeQueue: Promise.resolve(),
	default: {
		bookmarks: {},
		categories: {},
		searchEngines: {},
	},
	get data() {
		return database.db.data;
	},
	// One write after another, and a failed one doesn't stop the next: the order is the queue's own, so the lld
	// documents can check it here rather than trusting the writer underneath
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
	async init({ path: dbPath }) {
		database.db = await openDatabase({ path: dbPath, defaults: database.default });

		// Sibling dotfolder next to the db file, e.g. ~/.homePage.json -> ~/.homePage-favicons/
		const { dir, name } = path.parse(database.db.path);
		database.faviconsDir = path.join(dir, `${name}-favicons`);

		fs.mkdirSync(database.faviconsDir, { recursive: true });
	},
};

export default database;
