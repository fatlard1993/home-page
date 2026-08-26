import { Notify, Button } from '@vanilla-bean/components';

import {
	deleteBookmark,
	createBookmark,
	getBookmarkFaviconDataUri,
	setBookmarkFaviconFromDataUri,
	deleteCategory,
	createCategory,
} from '../api';

const describeDeletion = (bookmarks, categories) => {
	if (bookmarks.length === 1 && categories.length === 0) return `Deleted "${bookmarks[0].name}"`;
	if (categories.length === 1 && bookmarks.length === 0) return `Deleted category "${categories[0].name}"`;

	const parts = [];

	if (bookmarks.length) parts.push(`${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`);
	if (categories.length) parts.push(`${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`);

	return `Deleted ${parts.join(' and ')}`;
};

/**
 * Delete bookmarks and categories, showing a notification with a time-limited Undo button
 * that restores everything (including favicons) if pressed.
 * @param {object} options - What to delete
 * @param {object[]} options.bookmarks - Bookmarks to delete
 * @param {object[]} [options.categories] - Categories to delete
 */
export default async function deleteWithUndo({ bookmarks, categories = [] }) {
	// Favicon files are removed server-side on delete, so they have to be captured first to
	// make a full restore possible. Reads only, so they can all go at once.
	const favicons = Object.fromEntries(
		await Promise.all(
			bookmarks.map(async bookmark => [
				bookmark.id,
				bookmark.favicon ? await getBookmarkFaviconDataUri(bookmark.id) : null,
			]),
		),
	);

	// Deleted individually rather than via a category delete's cascade, since a bookmark's
	// category may have been reassigned locally (batch-mode drag) without saving to the server.
	// Sequential because a category's cascade would race the individual deletes of its own
	// bookmarks. Only the final delete keeps its cache invalidation — the intermediate ones
	// would each cost a full bookmarks + categories refetch on the way through.
	const deletions = [
		...bookmarks.map(bookmark => options => deleteBookmark(bookmark.id, options)),
		...categories.map(category => options => deleteCategory(category.id, options)),
	];

	for (const [index, deletion] of deletions.entries()) {
		await deletion(index === deletions.length - 1 ? undefined : { invalidates: [] });
	}

	const notify = new Notify({
		type: 'warning',
		timeout: 10000,
		x: window.innerWidth - 16,
		y: window.innerHeight - 16,
		content: describeDeletion(bookmarks, categories),
	});

	const undoButton = new Button({
		appendTo: notify,
		textContent: 'Undo',
		onPointerPress: async () => {
			// Restoring is one request per record: locked on first press so a double-click
			// cannot run it twice and duplicate everything it restores.
			if (undoButton.options.disabled) return;
			undoButton.options.disabled = true;

			try {
				const categoryIdMap = {};

				for (const category of categories) {
					const created = await createCategory({
						body: { name: category.name, color: category.color || '', order: category.order },
					});
					categoryIdMap[category.id] = created.body.id;
				}

				for (const bookmark of bookmarks) {
					const category = categoryIdMap[bookmark.category] ?? bookmark.category ?? '';
					const created = await createBookmark({
						body: {
							name: bookmark.name,
							url: bookmark.url,
							color: bookmark.color || '',
							category,
							order: bookmark.order,
						},
					});

					if (favicons[bookmark.id]) await setBookmarkFaviconFromDataUri(created.body.id, favicons[bookmark.id]);
				}

				notify.destroy();
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error(error);
				notify.destroy();

				new Notify({
					type: 'error',
					timeout: 6000,
					x: window.innerWidth - 16,
					y: window.innerHeight - 16,
					content: 'Undo failed part way through. Some items may already be restored.',
				});
			}
		},
	});
}
