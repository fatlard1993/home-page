import { findByRole } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

import BookmarksContainer from './BookmarksContainer';

const container = new JSDOM().window.document.body;

describe('BookmarksContainer', () => {
	test('must render', async () => {
		new BookmarksContainer({ bookmarks: [{ name: 'test', url: 'test.com' }], heading: 'heading', appendTo: container });

		await findByRole(container, 'heading');
		await findByRole(container, 'link');
	});
});
