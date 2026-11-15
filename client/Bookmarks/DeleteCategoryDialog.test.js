import { findByRole, getAllByRole, getByRole, waitFor } from '@testing-library/dom';

import DeleteCategoryDialog from './DeleteCategoryDialog';

describe('DeleteCategoryDialog', () => {
	// The delete is toasted with Undo, so the dialog only asks where the bookmarks go: not in danger, Cancel first
	test('asks where the bookmarks go, not in danger, Cancel first', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({ status: 'success', body: {}, unsubscribe: () => {} }),
		}));

		try {
			const dialog = new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			await findByRole(container, 'dialog', { hidden: true });

			const buttons = getAllByRole(dialog.elem, 'button', { hidden: true });

			expect(dialog.elem.classList.contains('intent-danger')).toBe(false);
			expect(buttons.map(button => button.textContent)).toEqual(['Cancel', 'Delete']);
			expect(buttons[0].dataset.action).toBe('cancel');
		} finally {
			mock.module('../api', () => real);
		}
	});

	test('the Keep Bookmarks checkbox has its label after it, on its line', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({ status: 'success', body: {}, unsubscribe: () => {} }),
		}));

		try {
			new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });

			const checkbox = await findByRole(container, 'checkbox', { name: 'Keep Bookmarks?', hidden: true });

			// Where the label sits is the Label's variant, which no role reports
			// eslint-disable-next-line testing-library/no-node-access
			expect(checkbox.closest('.variant-inline-after')).not.toBeNull();
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
			getBookmarks: async () => ({ status: 'success', body: {}, unsubscribe: () => {} }),
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

	test('Delete moves the bookmarks where chosen, closes, and toasts Undo, which puts them back', async () => {
		const real = { ...(await import('../api')) };
		const calls = [];

		mock.module('../api', () => ({
			...real,
			getCategories: async () => ({
				status: 'success',
				body: { c1: { id: 'c1', name: 'Dev', color: '', order: 2 }, c2: { id: 'c2', name: 'News', order: 0 } },
				unsubscribe: () => {},
			}),
			getBookmarks: async () => ({
				status: 'success',
				body: {
					b1: { id: 'b1', name: 'a', category: 'c1', order: 0 },
					b2: { id: 'b2', name: 'b', category: 'c2', order: 0 },
				},
				unsubscribe: () => {},
			}),
			deleteCategory: async (id, options) => calls.push(['deleteCategory', id, options]) && {},
			createCategory: async ({ body }) => calls.push(['createCategory', body]) && { body: { id: 'c3', ...body } },
			updateBookmark: async (id, { body }) => calls.push(['updateBookmark', id, body]) && { body },
		}));

		try {
			const dialog = new DeleteCategoryDialog({ category: { id: 'c1', name: 'Dev' }, appendTo: container });
			const moveTo = await findByRole(container, 'combobox', { hidden: true });

			// It opens a moment after it's made
			await waitFor(() => expect(dialog.elem.open).toBe(true));

			moveTo.value = 'c2';
			moveTo.dispatchEvent(new Event('change', { bubbles: true }));
			(await findByRole(container, 'button', { name: 'Delete', hidden: true })).click();
			await new Promise(resolve => setTimeout(resolve, 30));

			expect(calls).toEqual([['deleteCategory', 'c1', { searchParameters: { moveTo: 'c2' } }]]);
			expect(dialog.elem.open).toBe(false);

			const toast = getAllByRole(document.body, 'status', { hidden: true }).at(-1);
			const undo = getByRole(toast, 'button', { name: 'Undo', hidden: true });

			expect(toast.textContent).toContain('Deleted category "Dev", its bookmark moved to News');

			undo.click();
			await new Promise(resolve => setTimeout(resolve, 30));

			expect(calls.slice(1)).toEqual([
				['createCategory', { name: 'Dev', color: '', order: 2 }],
				['updateBookmark', 'b1', { category: 'c3', order: 0 }],
			]);
		} finally {
			mock.module('../api', () => real);
		}
	});
});
