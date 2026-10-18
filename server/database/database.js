import fs from 'fs';
import path from 'path';

import { openDatabase } from '@vanilla-bean/components/app';

// The stores are made at import and read this lazily, so they work once init has run
const database = {
	default: {
		bookmarks: {},
		categories: {},
		searchEngines: {},
	},
	get data() {
		return database.db.data;
	},
	write() {
		return database.db.write();
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
