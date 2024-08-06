import { findByRole, findAllByRole, fireEvent, queryByRole, waitForElementToBeRemoved } from '@testing-library/dom';

import BookmarkDialog from './BookmarkDialog';

describe('BookmarkDialog', () => {
	beforeAll(() => {
		global.isSecureContext = true;

		mock.module('../../api', () => ({
			getCategories: async () => ({ body: {} }),
		}));
	});

	test.skip('must provide a way to cancel the operation', async () => {
		new BookmarkDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});

		await waitForElementToBeRemoved(() => queryByRole(container, 'dialog'));
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

	test.skip('must require a Name and URL', async () => {
		new BookmarkDialog({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
		await findByRole(container, 'textbox', { name: 'URL' });
	});
});
