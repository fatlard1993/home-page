import { findByRole } from '@testing-library/dom';

import BookmarksToolbar from './BookmarksToolbar';

describe('BookmarksToolbar', () => {
	test('must render', async () => {
		new BookmarksToolbar({ search: () => {}, appendTo: container });

		await findByRole(container, 'searchbox');
		await findByRole(container, 'button');
	});
});
