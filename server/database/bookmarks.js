import { nanoid } from 'nanoid';

import database from './index.js';
import categories from './categories.js';

const bookmarks = {
	create(data) {
		const id = nanoid(6);

		if (data.category && !database.db.data.categories[data.category]) {
			data.category = categories.create({ name: data.category });
		}

		database.db.data.bookmarks[id] = Object.assign({ id, name: '', url: '', color: '', category: '' }, data);

		database.db.write();

		return id;
	},
	read({ id } = {}) {
		if (id) return database.db.data.bookmarks[id];

		return {
			bookmarkIds: Object.keys(database.db.data.bookmarks),
			bookmarks: database.db.data.bookmarks,
			categories: database.db.data.categories,
		};
	},
	update({ id, update }) {
		if (update.category && !database.db.data.categories[update.category]) {
			update.category = categories.create({ name: update.category });
		}

		database.db.data.bookmarks[id] = Object.assign(database.db.data.bookmarks[id], update);

		database.db.write();

		return id;
	},
	delete({ id }) {
		delete database.db.data.bookmarks[id];

		database.db.write();

		return id;
	},
};

export default bookmarks;
