import confirmDialog from './confirmDialog';

/**
 * Ask the user to confirm discarding unsaved batch-edit changes.
 * @returns {Promise<boolean>} true if the user chose to discard
 */
export default function confirmDiscardBatch() {
	return confirmDialog({
		header: 'Discard batch edits?',
		body: 'Your reorders, moves, colors, and deletion marks have not been saved. This cannot be undone.',
		cancelLabel: 'Keep editing',
		confirmLabel: 'Discard',
	});
}
