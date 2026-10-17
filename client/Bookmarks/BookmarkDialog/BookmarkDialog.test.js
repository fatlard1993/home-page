import { findByRole, findAllByRole, fireEvent, queryByRole } from '@testing-library/dom';

import BookmarkDialog from './BookmarkDialog';

describe('BookmarkDialog', () => {
	beforeAll(() => {
		global.isSecureContext = true;

		mock.module('../../api', () => ({
			getCategories: async () => ({ body: {} }),
		}));
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
});
