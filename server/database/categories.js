import { createStore } from '@vanilla-bean/components/app';

import { deleteFavicon } from '../utils/faviconStorage';
import database from '.';

export default createStore({
	db: database,
	collection: 'categories',
	fields: ['name', 'color', 'order'],
	hooks: {
		// Coupled to bookmarks: its bookmarks move to another category, or go with it. Changed in place rather than
		// through the bookmarks store, so the category's own write saves them all at once.
		async afterDelete(id, { moveTo }) {
			const { bookmarks, categories } = database.db.data;
			// Moving to a category that isn't there (the deleted one, one deleted since) lands them in Default
			const target = categories[moveTo] ? moveTo : '';
			const affected = Object.keys(bookmarks).filter(bookmarkId => bookmarks[bookmarkId]?.category === id);

			for (const bookmarkId of affected) {
				if (moveTo !== undefined) {
					bookmarks[bookmarkId].category = target;
				} else {
					// A bookmark that goes takes its favicon file with it, as its own delete would
					delete bookmarks[bookmarkId];
					await deleteFavicon(bookmarkId);
				}
			}
		},
	},
});
