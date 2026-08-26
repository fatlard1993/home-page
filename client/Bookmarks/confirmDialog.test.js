import { describe, test, expect } from 'bun:test';

import confirmDialog from './confirmDialog';
import confirmBatchDelete from './confirmBatchDelete';
import confirmDiscardBatch from './confirmDiscardBatch';

// confirmDialog and its callers hand back only a Promise, so the dialog is grabbed from the DOM
// where Dialog appends itself (document.body). The footer buttons are real <button> elements whose
// textContent is the label, in the order the `buttons` array was given.
// A pressed dialog is closed but left in the DOM (removed only on the native-close fade path), so a
// second confirm in one test adds another <dialog>; always drive the most recently created one.
const currentDialog = () => [...document.querySelectorAll('dialog')].at(-1);
const footerButtons = dialog => [...dialog.querySelectorAll('.footer button')];
const footerLabels = dialog => footerButtons(dialog).map(button => button.textContent);
const press = button => button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

describe('confirmDialog', () => {
	test('renders the safe cancel button before the destructive confirm button', () => {
		confirmDialog({ header: 'Header', body: 'Body', cancelLabel: 'Cancel', confirmLabel: 'Delete' });

		expect(footerLabels(currentDialog())).toEqual(['Cancel', 'Delete']);
	});

	test('pressing the confirm button resolves the promise to true', async () => {
		const choice = confirmDialog({ header: 'H', body: 'B', confirmLabel: 'Delete' });
		const [, confirm] = footerButtons(currentDialog());

		press(confirm);

		expect(await choice).toBe(true);
	});

	test('pressing the cancel button resolves the promise to false', async () => {
		const choice = confirmDialog({ header: 'H', body: 'B', confirmLabel: 'Delete' });
		const [cancel] = footerButtons(currentDialog());

		press(cancel);

		expect(await choice).toBe(false);
	});

	test('the native close event resolves to false without throwing or double-resolving', async () => {
		const choice = confirmDialog({ header: 'H', body: 'B', confirmLabel: 'Delete' });
		const dialog = currentDialog();

		// Every dismissal path (backdrop, Escape) surfaces as the dialog's native close event.
		dialog.dispatchEvent(new Event('close'));

		expect(await choice).toBe(false);

		// A second dismissal, and a late button press, must be inert no-op resolves rather than throw.
		expect(() => dialog.dispatchEvent(new Event('close'))).not.toThrow();
		const [, confirm] = footerButtons(dialog);
		expect(() => press(confirm)).not.toThrow();
		expect(await choice).toBe(false);
	});

	test('the dialog element is removed from the DOM within ~400ms of closing', async () => {
		const choice = confirmDialog({ header: 'H', body: 'B', confirmLabel: 'Delete' });
		const dialog = currentDialog();

		dialog.dispatchEvent(new Event('close'));
		await choice;

		expect(dialog.isConnected).toBe(true);

		await new Promise(resolve => setTimeout(resolve, 450));

		expect(dialog.isConnected).toBe(false);
	});
});

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
