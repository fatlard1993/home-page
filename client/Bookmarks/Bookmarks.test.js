import { findByRole } from '@testing-library/dom';

import Bookmarks from './Bookmarks';

// Requires mocking all API calls (getBookmarks, getCategories, getSearchEngines) before unskipping
describe.skip('Bookmarks', () => {
	test('must render', async () => {
		new Bookmarks({ appendTo: container });

		await findByRole(container, 'search');
	});
});
