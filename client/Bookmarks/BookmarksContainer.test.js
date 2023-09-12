import { findByRole } from '@testing-library/dom';

import BookmarksContainer from './BookmarksContainer';

describe('BookmarksContainer', () => {
	test('must render', async () => {
		new BookmarksContainer({ bookmarks: [{ name: 'test', url: 'test.com' }], heading: 'heading', appendTo: container });

		await findByRole(container, 'heading');
		await findByRole(container, 'link');
	});
});
