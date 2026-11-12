import { describe, test, expect } from 'bun:test';

import confirmDiscardBatch from './confirmDiscardBatch';

// The confirms hand back only a Promise, so the dialog is grabbed from the DOM where Dialog appends
// itself (document.body). The footer buttons are real <button> elements whose textContent is the
// label, in the order the `buttons` array was given. Always drive the most recently created dialog.
const currentDialog = () => [...document.querySelectorAll('dialog')].at(-1);
const footerButtons = dialog => [...dialog.querySelectorAll('.footer button')];
const footerLabels = dialog => footerButtons(dialog).map(button => button.textContent);
const press = button => button.click();

describe('confirmDiscardBatch', () => {
	test('offers "Keep editing" before "Discard"', () => {
		confirmDiscardBatch();

		expect(footerLabels(currentDialog())).toEqual(['Keep editing', 'Discard']);
	});

	test('resolves true only for Discard, false for Keep editing', async () => {
		const discarded = confirmDiscardBatch();
		const [, discard] = footerButtons(currentDialog());

		press(discard);
		expect(await discarded).toBe(true);

		const kept = confirmDiscardBatch();
		const [keep] = footerButtons(currentDialog());

		press(keep);
		expect(await kept).toBe(false);
	});
});
