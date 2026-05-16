import categories from './categories.js';
import { createCRUD } from './crud';

export default createCRUD('bookmarks', ['name', 'url', 'color', 'category'], {
	async beforeCreate(entry, data) {
		if (data.category?.create) entry.category = (await categories.create(data.category.create)).id;
	},
	async beforeUpdate(update) {
		if (update.category?.create) update.category = (await categories.create(update.category.create)).id;
	},
});
