import { Dialog } from '@vanilla-bean/components';

/**
 * Show a small modal confirm dialog and resolve to the user's choice.
 *
 * The confirm button is placed second on purpose: the dialog focuses its first button, so a
 * reflexive Enter lands on the safe choice (cancel/keep) rather than the destructive one. The
 * native close event fires on every dismissal path — button, backdrop, or Escape — so the promise
 * can never hang (a second resolve is a no-op), and the element, which Dialog.close() leaves in the
 * DOM, is removed here after its 0.3s fade-out.
 * @param {object} options - Dialog configuration
 * @param {string|any[]} options.header - Dialog header
 * @param {string|any[]} options.body - Dialog body
 * @param {string} [options.cancelLabel] - Label for the safe first button
 * @param {string} options.confirmLabel - Label for the confirming second button
 * @returns {Promise<boolean>} true if the user pressed the confirm button
 */
export default function confirmDialog({ header, body, cancelLabel = 'Cancel', confirmLabel }) {
	return new Promise(resolve => {
		const dialog = new Dialog({
			size: 'small',
			header,
			body,
			buttons: [cancelLabel, confirmLabel],
			onButtonPress: ({ button, closeDialog }) => {
				resolve(button === confirmLabel);
				closeDialog();
			},
			onClose: () => {
				resolve(false);
				setTimeout(() => dialog.elem.remove(), 400);
			},
		});
	});
}
