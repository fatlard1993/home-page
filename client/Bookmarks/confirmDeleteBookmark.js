import { Dialog, Notify } from '@vanilla-bean/components';

import deleteWithUndo from './deleteWithUndo';

/**
 * The question asked before a bookmark is deleted, as Dialog.confirm options.
 * @param {object} bookmark - The bookmark to delete
 * @returns {object} header and body
 */
export const deleteQuestion = bookmark => ({
	header: `Delete "${bookmark.name}"?`,
	body: 'You can undo this for a few seconds after deleting.',
});

/**
 * Ask the user to confirm deleting a single bookmark, then delete it with an undo window, telling the user when it fails.
 * @param {object} bookmark - The bookmark to delete
 */
export default async function confirmDeleteBookmark(bookmark) {
	if (!(await Dialog.confirm({ ...deleteQuestion(bookmark), confirmLabel: 'Delete' }))) return;

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
