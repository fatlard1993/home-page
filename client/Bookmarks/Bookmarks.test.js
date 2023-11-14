import { findByRole } from '@testing-library/dom';

import Bookmarks from './Bookmarks';

describe.skip('Bookmarks', () => {
	test('must render', async () => {
		new Bookmarks({ appendTo: container });

		await findByRole(container, 'search');
	});
});
