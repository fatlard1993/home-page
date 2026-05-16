import { createCRUD } from './crud';
import database from '.';

export default createCRUD('categories', ['name', 'color'], {
	// Coupled to bookmarks: moves or deletes bookmarks belonging to the removed category.
	// Snapshot-based so partial mutation doesn't leave bookmarks in a broken state.
	async afterDelete(id, { moveTo }) {
		const bookmarks = database.db.data.bookmarks;
		const affected = Object.keys(bookmarks).filter(bid => bookmarks[bid]?.category === id);
		const snapshot = Object.fromEntries(affected.map(bid => [bid, { ...bookmarks[bid] }]));

		try {
			for (const bookmarkId of affected) {
				if (moveTo !== undefined) bookmarks[bookmarkId].category = moveTo;
				else delete bookmarks[bookmarkId];
			}
		} catch (error) {
			for (const [bid, data] of Object.entries(snapshot)) bookmarks[bid] = data;
			throw error;
		}
	},
});
