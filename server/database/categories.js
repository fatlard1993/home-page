import { createStore } from '@vanilla-bean/components/app';

import database from '.';

export default createStore({
	db: database,
	collection: 'categories',
	fields: ['name', 'color', 'order'],
	hooks: {
		// Coupled to bookmarks: moves or deletes bookmarks belonging to the removed category.
		// Snapshot-based so partial mutation doesn't leave bookmarks in a broken state.
		async afterDelete(id, { moveTo }) {
			const { bookmarks, categories } = database.db.data;
			// Moving to a category that isn't there (the deleted one, one deleted since) lands them in Default
			const target = categories[moveTo] ? moveTo : '';
			const affected = Object.keys(bookmarks).filter(bid => bookmarks[bid]?.category === id);
			const snapshot = Object.fromEntries(affected.map(bid => [bid, { ...bookmarks[bid] }]));

			try {
				for (const bookmarkId of affected) {
					if (moveTo !== undefined) bookmarks[bookmarkId].category = target;
					else delete bookmarks[bookmarkId];
				}
			} catch (error) {
				for (const [bid, data] of Object.entries(snapshot)) bookmarks[bid] = data;
				throw error;
			}
		},
	},
});
