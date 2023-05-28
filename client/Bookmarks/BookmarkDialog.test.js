import { findByRole, findAllByRole, fireEvent, queryByRole, waitForElementToBeRemoved } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

import BookmarkDialog from './BookmarkDialog';

const container = new JSDOM().window.document.body;

describe('BookmarkDialog', () => {
	test('must render new bookmark form', async () => {
		new BookmarkDialog({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
		await findByRole(container, 'textbox', { name: 'URL' });
	});

	test('must render edit bookmark form', async () => {
		const bookmark = {};

		new BookmarkDialog({ bookmark, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test('must provide a way to cancel the operation', async () => {
		new BookmarkDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});

		await waitForElementToBeRemoved(() => queryByRole(container, 'dialog'));
	});

	test.skip('must require a Name and URL', async () => {
		new BookmarkDialog({ appendTo: container });

		await findByRole(container, 'button', { name: 'Save' });

		await findByRole(container, 'textbox', { name: 'Name' });
		await findByRole(container, 'textbox', { name: 'URL' });
	});
});
