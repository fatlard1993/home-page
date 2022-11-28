import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const database = {
	default: {
		bookmarks: {},
		categories: {},
	},
	async init({ path }) {
		database.db = new Low(new JSONFile(path));

		await database.db.read();

		database.db.data = Object.assign(database.default, database.db.data || {});

		await database.db.write();
	},
};

export default database;
