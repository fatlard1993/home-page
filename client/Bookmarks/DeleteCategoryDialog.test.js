import { findByRole } from '@testing-library/dom';

import DeleteCategoryDialog from './DeleteCategoryDialog';

describe('DeleteCategoryDialog', () => {
	// mock.module is process-wide, so the real api goes back once this test is done with it
	test('a refused delete stays open and says why', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({ status: 'success', body: {}, unsubscribe: () => {} }),
			deleteCategory: async () => ({ status: 'error', body: { error: 'Category not found' } }),
		}));

		try {
			const dialog = new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			await findByRole(container, 'dialog', { hidden: true });
			(await findByRole(container, 'button', { name: 'Delete', hidden: true })).click();
			await new Promise(resolve => setTimeout(resolve, 20));

			expect(dialog.elem.isConnected).toBe(true);
			expect(document.body.textContent).toContain('Could not delete "Dev": Category not found');
		} finally {
			mock.module('../api', () => real);
		}
	});
});
