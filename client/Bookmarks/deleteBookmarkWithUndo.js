import { Notify } from '@vanilla-bean/components';

import deleteWithUndo from './deleteWithUndo';

/**
 * Delete a single bookmark straight away with an undo window, telling the user when it fails.
 * Not confirmed first: the Undo toast is the safety.
 * @param {object} bookmark - The bookmark to delete
 */
export default async function deleteBookmarkWithUndo(bookmark) {
	try {
		await deleteWithUndo({ bookmarks: [bookmark] });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);

		new Notify({
			intent: 'danger',
			timeout: 6000,
			content: `Could not delete "${bookmark.name}": ${error.message}`,
		});
	}
}
