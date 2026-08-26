import { Notify } from '@vanilla-bean/components';

import confirmDialog from './confirmDialog';
import deleteWithUndo from './deleteWithUndo';

/**
 * Ask the user to confirm deleting a single bookmark, then delete it with an undo window.
 * @param {object} bookmark - The bookmark to delete
 */
export default async function confirmDeleteBookmark(bookmark) {
	const confirmed = await confirmDialog({
		header: `Delete "${bookmark.name}"?`,
		body: 'You can undo this for a few seconds after deleting.',
		confirmLabel: 'Delete',
	});

	if (!confirmed) return;

	try {
		await deleteWithUndo({ bookmarks: [bookmark] });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);

		new Notify({
			type: 'error',
			timeout: 6000,
			x: window.innerWidth - 16,
			y: window.innerHeight - 16,
			content: `Could not delete "${bookmark.name}".`,
		});
	}
}
