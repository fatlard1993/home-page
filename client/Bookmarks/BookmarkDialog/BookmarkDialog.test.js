import { findByRole, findAllByRole, fireEvent, queryByRole } from '@testing-library/dom';

import BookmarkDialog from './BookmarkDialog';

const api = {
	getCategories: async () => ({ body: {} }),
};

describe('BookmarkDialog', () => {
	beforeAll(() => {
		global.isSecureContext = true;

		mock.module('../../api', () => api);
	});

	test('must provide a way to cancel the operation', async () => {
		new BookmarkDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});
		await new Promise(resolve => setTimeout(resolve, 20));

		expect(queryByRole(container, 'dialog', { hidden: true })).toBeNull();
	});

	test('must render new bookmark form', async () => {
		new BookmarkDialog({ appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test('must render edit bookmark form', async () => {
		const bookmark = { name: 'name', url: 'url' };

		new BookmarkDialog({ bookmark, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test('must require a Name and URL', async () => {
		const dialog = new BookmarkDialog({ appendTo: container });

		await findAllByRole(container, 'textbox');

		expect(await dialog.save()).toBe(false);
		expect(dialog.elem.isConnected).toBe(true);
	});

	test('a refused favicon closes the saved bookmark and says why', async () => {
		mock.module('../../api', () => ({
			...api,
			updateBookmark: async (id, { body }) => ({ status: 'success', body: { id, ...body } }),
			setBookmarkFaviconFromDataUri: async () => ({ status: 'error', body: { error: 'Not an image' } }),
		}));

		try {
			const dialog = new BookmarkDialog({ bookmark: { id: 'b1', name: 'Mail', url: 'url' }, appendTo: container });

			await findAllByRole(container, 'textbox');

			dialog.form._pendingFaviconDataUri = 'data:text/plain;base64,bm90';

			expect(await dialog.save()).toBe(true);
			expect(document.body.textContent).toContain('Saved "Mail", but not its favicon: Not an image');
		} finally {
			mock.module('../../api', () => api);
		}
	});
});
