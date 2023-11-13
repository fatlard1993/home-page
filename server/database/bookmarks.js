import { nanoid } from 'nanoid';

import categories from './categories.js';
import database from '.';

const bookmarks = {
	get data() {
		return database.db.data.bookmarks;
	},
	create(data) {
		const id = nanoid(6);

		if (data.category && !categories.data[data.category]) {
			data.category = categories.create({ name: data.category });
		}

		const newBookmark = { name: '', url: '', color: '', category: '', ...data, id };

		bookmarks.data[id] = newBookmark;

		database.db.write();

		return newBookmark;
	},
	read({ id } = {}) {
		if (id) return bookmarks.data[id] || false;

		return bookmarks.data;
	},
	update({ id, update }) {
		if (!bookmarks.data[id]) return false;

		if (update.category && !categories.data[update.category]) {
			update.category = categories.create({ name: update.category });
		}

		const newBookmark = { ...bookmarks.data[id], ...update };

		bookmarks.data[id] = newBookmark;

		database.db.write();

		return newBookmark;
	},
	delete({ id }) {
		if (!bookmarks.data[id]) return false;

		delete bookmarks.data[id];

		database.db.write();

		return id;
	},
};

export default bookmarks;
