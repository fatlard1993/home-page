import { describe, test, expect } from 'bun:test';

import confirmBatchDelete from './confirmBatchDelete';
import confirmDiscardBatch from './confirmDiscardBatch';

// The confirms hand back only a Promise, so the dialog is grabbed from the DOM where Dialog appends
// itself (document.body). The footer buttons are real <button> elements whose textContent is the
// label, in the order the `buttons` array was given. Always drive the most recently created dialog.
const currentDialog = () => [...document.querySelectorAll('dialog')].at(-1);
const footerButtons = dialog => [...dialog.querySelectorAll('.footer button')];
const footerLabels = dialog => footerButtons(dialog).map(button => button.textContent);
const press = button => button.click();

describe('confirmBatchDelete', () => {
	test('offers Cancel before Delete', () => {
		confirmBatchDelete(1, 0);

		expect(footerLabels(currentDialog())).toEqual(['Cancel', 'Delete']);
	});

	test('the header reflects the bookmark count', () => {
		confirmBatchDelete(1, 0);

		expect(currentDialog().textContent).toContain('1 bookmark');
	});

	test('the header reflects both bookmark and category counts', () => {
		confirmBatchDelete(2, 1);

		const text = currentDialog().textContent;

		expect(text).toContain('2 bookmarks');
		expect(text).toContain('1 category');
	});

	test('pressing Delete resolves true, pressing Cancel resolves false', async () => {
		const confirmed = confirmBatchDelete(3, 0);
		const [, del] = footerButtons(currentDialog());

		press(del);
		expect(await confirmed).toBe(true);

		const declined = confirmBatchDelete(3, 0);
		const [cancel] = footerButtons(currentDialog());

		press(cancel);
		expect(await declined).toBe(false);
	});
});

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
