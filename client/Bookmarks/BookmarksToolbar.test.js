import { findByRole } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

import BookmarksToolbar from './BookmarksToolbar';

const container = new JSDOM().window.document.body;

describe('BookmarksToolbar', () => {
	test('must render', async () => {
		new BookmarksToolbar({ search: () => {}, appendTo: container });

		await findByRole(container, 'searchbox');
		await findByRole(container, 'button');
	});
});
