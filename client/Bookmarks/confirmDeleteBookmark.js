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
 * Delete a bookmark with an undo window, telling the user when it fails.
 * @param {object} bookmark - The bookmark to delete
 * @returns {Promise<boolean>} Whether it was deleted
 */
export const deleteBookmark = async bookmark => {
	try {
		await deleteWithUndo({ bookmarks: [bookmark] });

		return true;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);

		new Notify({
			type: 'error',
			timeout: 6000,
			content: `Could not delete "${bookmark.name}".`,
		});

		return false;
	}
};

/**
 * Ask the user to confirm deleting a single bookmark, then delete it with an undo window.
 * @param {object} bookmark - The bookmark to delete
 */
export default async function confirmDeleteBookmark(bookmark) {
	if (await Dialog.confirm({ ...deleteQuestion(bookmark), confirmLabel: 'Delete' })) await deleteBookmark(bookmark);
}
