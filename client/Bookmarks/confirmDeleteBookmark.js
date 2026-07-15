import { Dialog } from '@vanilla-bean/components';

import deleteWithUndo from './deleteWithUndo';

/**
 * Ask the user to confirm deleting a single bookmark, then delete it with an undo window.
 * @param {object} bookmark - The bookmark to delete
 */
export default function confirmDeleteBookmark(bookmark) {
	new Dialog({
		size: 'small',
		header: `Delete "${bookmark.name}"?`,
		body: 'You can undo this for a few seconds after deleting.',
		buttons: ['Delete', 'Cancel'],
		onButtonPress: ({ button, closeDialog }) => {
			if (button === 'Delete') deleteWithUndo({ bookmarks: [bookmark] });

			closeDialog();
		},
	});
}
