import { findByRole } from '@testing-library/dom';

import CategoryDialog from './CategoryDialog';

describe('CategoryDialog', () => {
	test('must provide a way to cancel the operation', async () => {
		const dialog = new CategoryDialog({ appendTo: container });

		await new Promise(resolve => setTimeout(resolve, 40));
		(await findByRole(container, 'button', { name: 'Cancel', hidden: true })).click();
		await new Promise(resolve => setTimeout(resolve, 20));

		expect(dialog.elem.isConnected).toBe(false);
	});

	test('must render new category form', async () => {
		const dialog = new CategoryDialog({ appendTo: container });

		expect(dialog.elem).toBeDefined();
		await findByRole(container, 'dialog');
	});

	test('must render edit category form', async () => {
		const category = {};
		const dialog = new CategoryDialog({ category, appendTo: container });

		expect(dialog.elem).toBeDefined();
		await findByRole(container, 'dialog');
	});

	test('must require a Name', async () => {
		const dialog = new CategoryDialog({ appendTo: container });

		expect(await dialog.save()).toBe(false);
		expect(dialog.elem.isConnected).toBe(true);
	});
});
