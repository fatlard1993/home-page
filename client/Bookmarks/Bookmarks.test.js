import { findByRole } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

import { Bookmarks } from './Bookmarks';

const container = new JSDOM().window.document.body;

describe.skip('Bookmarks', () => {
	test('must render', async () => {
		new Bookmarks({ appendTo: container });

		await findByRole(container, 'search');
	});
});
