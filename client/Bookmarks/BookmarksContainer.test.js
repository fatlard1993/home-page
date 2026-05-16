import { findByRole } from '@testing-library/dom';

import BookmarksContainer from './BookmarksContainer';

describe('BookmarksContainer', () => {
	test('must render with bookmarks', async () => {
		const bc = new BookmarksContainer({
			bookmarks: [{ name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
		});

		await findByRole(container, 'link');

		expect(bc.elem).toBeDefined();
	});
});
