import { nanoid } from 'nanoid';

import database from './index.js';

const categories = {
	create(data) {
		const id = nanoid(6);

		database.db.data.categories[id] = Object.assign({ id, name: '', color: '' }, data);

		database.db.write();

		return id;
	},
	read({ id } = {}) {
		if (id) return database.db.data.categories[id];

		return database.db.data.categories;
	},
	update({ id, update }) {
		database.db.data.categories[id] = Object.assign(database.db.data.categories[id], update);

		database.db.write();

		return id;
	},
	delete({ id, removeBookmarks = false }) {
		delete database.db.data.categories[id];

		Object.keys(database.db.data.bookmarks).forEach(bookmarkId => {
			if (database.db.data.bookmarks[bookmarkId].category === id) {
				if (removeBookmarks) delete database.db.data.bookmarks[bookmarkId];
				else database.db.data.bookmarks[bookmarkId].category = undefined;
			}
		});

		database.db.write();

		return id;
	},
};

export default categories;
