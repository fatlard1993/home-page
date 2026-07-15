import { Dialog } from '@vanilla-bean/components';

/**
 * Ask the user to confirm a batch deletion before it happens.
 * @param {number} bookmarkCount - How many bookmarks are marked for deletion
 * @param {number} categoryCount - How many categories are marked for deletion
 * @returns {Promise<boolean>} true if the user confirmed the deletion
 */
export default function confirmBatchDelete(bookmarkCount, categoryCount) {
	return new Promise(resolve => {
		const parts = [];

		if (bookmarkCount) parts.push(`${bookmarkCount} bookmark${bookmarkCount === 1 ? '' : 's'}`);
		if (categoryCount) parts.push(`${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'}`);

		let resolved = false;

		new Dialog({
			size: 'small',
			header: `Delete ${parts.join(' and ')}?`,
			body: 'You can undo this for a few seconds after deleting.',
			buttons: ['Delete', 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				resolved = true;
				resolve(button === 'Delete');
				closeDialog();
			},
			onDisconnected: () => {
				if (!resolved) resolve(false);
			},
		});
	});
}
