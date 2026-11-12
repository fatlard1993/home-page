import { findByRole, getAllByRole } from '@testing-library/dom';

import DeleteCategoryDialog from './DeleteCategoryDialog';

describe('DeleteCategoryDialog', () => {
	// This path has no undo, so it asks in danger, with Cancel first and out of the danger color
	test('asks in danger, Cancel first', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({ status: 'success', body: {}, unsubscribe: () => {} }),
		}));

		try {
			const dialog = new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			await findByRole(container, 'dialog', { hidden: true });

			const buttons = getAllByRole(dialog.elem, 'button', { hidden: true });

			expect(dialog.elem.classList.contains('intent-danger')).toBe(true);
			expect(buttons.map(button => button.textContent)).toEqual(['Cancel', 'Delete']);
			expect(buttons[0].dataset.action).toBe('cancel');
		} finally {
			mock.module('../api', () => real);
		}
	});

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

	test('a refused category list still offers Default, and says why', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({ status: 'error', body: { error: 'Database busy' }, unsubscribe: () => {} }),
		}));

		try {
			new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			const moveTo = await findByRole(container, 'combobox', { hidden: true });

			expect(getAllByRole(moveTo, 'option', { hidden: true }).map(option => option.label)).toEqual(['Default']);
			expect(document.body.textContent).toContain('Could not load the categories: Database busy');
		} finally {
			mock.module('../api', () => real);
		}
	});

	test('Move To leaves out the category being deleted', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({
				status: 'success',
				body: { c1: { id: 'c1', name: 'Dev' }, c2: { id: 'c2', name: 'News' } },
				unsubscribe: () => {},
			}),
		}));

		try {
			new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			const moveTo = await findByRole(container, 'combobox', { hidden: true });

			expect(getAllByRole(moveTo, 'option', { hidden: true }).map(option => option.label)).toEqual(['Default', 'News']);
		} finally {
			mock.module('../api', () => real);
		}
	});
});
