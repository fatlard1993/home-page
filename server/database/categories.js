import { nanoid } from 'nanoid';

import database from '.';

const categories = {
	get data() {
		return database.db.data.categories;
	},
	create(data) {
		const id = nanoid(6);
		const newCategory = { name: '', color: '', ...data, id };

		categories.data[id] = newCategory;

		database.db.write();

		return newCategory;
	},
	read({ id } = {}) {
		if (id) return categories.data[id] || false;

		return categories.data;
	},
	update({ id, update }) {
		if (!categories.data[id]) return false;

		const newCategory = { ...categories.data[id], ...update };

		categories.data[id] = newCategory;

		database.db.write();

		return newCategory;
	},
	delete({ id, recursive = false }) {
		if (!categories.data[id]) return false;

		delete categories.data[id];

		Object.keys(database.db.data.bookmarks).forEach(bookmarkId => {
			if (database.db.data.bookmarks[bookmarkId].category === id) {
				if (recursive) delete database.db.data.bookmarks[bookmarkId];
				else database.db.data.bookmarks[bookmarkId].category = undefined;
			}
		});

		database.db.write();

		return id;
	},
};

export default categories;
