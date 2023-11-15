import { findByRole, findAllByRole } from '@testing-library/dom';

import BookmarkForm from './BookmarkForm';

describe.skip('BookmarkForm', () => {
	test('must render new bookmark form', async () => {
		new BookmarkForm({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
		await findByRole(container, 'textbox', { name: 'URL' });
	});

	test('must render edit bookmark form', async () => {
		const bookmark = { name: 'name', url: 'url' };

		new BookmarkForm({ bookmark, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test.skip('must require a Name and URL', async () => {
		new BookmarkForm({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
		await findByRole(container, 'textbox', { name: 'URL' });
	});
});
