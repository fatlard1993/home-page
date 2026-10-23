import { findByRole, fireEvent } from '@testing-library/dom';

import BookmarksToolbar from './BookmarksToolbar';

describe('BookmarksToolbar', () => {
	test('must render', async () => {
		new BookmarksToolbar({ search: () => {}, appendTo: container });

		await findByRole(container, 'searchbox');
		await findByRole(container, 'button');
	});

	// mock.module is process-wide, so the real api goes back once this test is done with it
	test('a refused engine list opens no menu and says why', async () => {
		const real = { ...(await import('../api')) };

		mock.module('../api', () => ({
			...real,
			getSearchEngines: async () => ({ status: 'error', body: { error: 'Database busy' } }),
		}));

		try {
			const toolbar = new BookmarksToolbar({ search: () => {}, appendTo: container });

			fireEvent.contextMenu(await findByRole(container, 'searchbox'));
			await new Promise(resolve => setTimeout(resolve, 20));

			expect(document.body.textContent).toContain('Could not load the search engines: Database busy');
			expect(toolbar.contextMenu.options.items ?? []).toEqual([]);
		} finally {
			mock.module('../api', () => real);
		}
	});
});
