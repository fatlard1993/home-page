import { findByRole, fireEvent } from '@testing-library/dom';

import BookmarksToolbar from './BookmarksToolbar';

describe('BookmarksToolbar', () => {
	test('must render', async () => {
		new BookmarksToolbar({ search: () => {}, appendTo: container });

		await findByRole(container, 'searchbox');
		await findByRole(container, 'button');
	});

	test("is the view's header bar", () => {
		const toolbar = new BookmarksToolbar({ search: () => {}, appendTo: container });

		expect(toolbar.hasClass('variant-bar')).toBe(true);
	});

	test('the + menu labels start with a verb, in sentence case', async () => {
		const toolbar = new BookmarksToolbar({ search: () => {}, appendTo: container });

		(await findByRole(container, 'button', { name: 'Add' })).click();

		expect(toolbar.contextMenu.options.items.map(item => item.textContent)).toEqual([
			'Add a bookmark',
			'Add a category',
			'Add a search engine',
		]);
	});

	// The key handler is debounced, so each assertion waits past it
	const settled = () => new Promise(resolve => setTimeout(resolve, 450));

	test('a term is handed on trimmed; Enter on only spaces opens nothing', async () => {
		const searches = [];
		const opened = [];
		const realOpen = window.open;

		window.open = url => opened.push(url);

		try {
			const toolbar = new BookmarksToolbar({ search: term => searches.push(term), appendTo: container });
			const input = await findByRole(container, 'searchbox');

			input.value = '  docs ';
			fireEvent.keyUp(input, { key: 's' });
			await settled();
			expect(searches.at(-1)).toBe('docs');

			input.value = '   ';
			fireEvent.keyUp(input, { key: 'Enter' });
			await settled();
			expect(opened).toEqual([]);

			input.value = ' nas.lan:8123 ';
			fireEvent.keyUp(input, { key: 'Enter' });
			await settled();
			expect(opened).toEqual(['http://nas.lan:8123']);
			expect(toolbar.elem.isConnected).toBe(true);
		} finally {
			window.open = realOpen;
		}
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
