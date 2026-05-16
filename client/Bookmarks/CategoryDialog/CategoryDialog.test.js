import { findByRole } from '@testing-library/dom';

import CategoryDialog from './CategoryDialog';

describe('CategoryDialog', () => {
	// Dialog close relies on animation/transition events not fired in test env
	test.skip('must provide a way to cancel the operation', async () => {});

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

	// Validation behavior needs form submission simulation
	test.skip('must require a Name', async () => {});
});
