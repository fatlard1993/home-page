import { nanoid } from 'nanoid';

import database from './database.js';

const bookmark = {
	create(data) {
		const id = nanoid(6);

		database.db.data.bookmarks[id] = Object.assign({ id, name: '', url: '', color: '' }, data);

		database.db.write();

		return id;
	},
	read({ id } = {}) {
		if (id) return database.db.data.bookmarks[id];

		return {
			bookmarkIds: Object.keys(database.db.data.bookmarks),
			bookmarks: database.db.data.bookmarks,
		};
	},
	update({ id, update }) {
		database.db.data.bookmarks[id] = Object.assign(database.db.data.bookmarks[id], update);

		database.db.write();

		return id;
	},
	remove({ id }) {
		delete database.db.data.bookmarks[id];

		database.db.write();

		return id;
	},
};

export default bookmark;
