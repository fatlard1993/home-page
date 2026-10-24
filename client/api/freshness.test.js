import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { resetRequest } from '@vanilla-bean/components';

import { getBookmarks, updateBookmark } from './bookmarks';
import { getCategories, updateCategory } from './categories';
import { getSearchEngines, updateSearchEngine } from './search';

const realFetch = globalThis.fetch;

beforeEach(() => {
	resetRequest();
	globalThis.fetch = mock(async () => Response.json({}));
});

afterAll(() => {
	globalThis.fetch = realFetch;
});

// Each list is kept fresh by the changes that invalidate it, so a subscriber must hear about a change even after
// its cache entry has expired
describe('a list subscriber hears about a change made after its cache entry expired', () => {
	for (const [name, getList, update] of [
		['bookmarks', getBookmarks, updateBookmark],
		['categories', getCategories, updateCategory],
		['search engines', getSearchEngines, updateSearchEngine],
	]) {
		test(name, async () => {
			const onResponse = mock();

			await getList({ invalidateAfter: 20, onResponse });
			await new Promise(resolve => setTimeout(resolve, 60));

			const heard = onResponse.mock.calls.length;

			await update('a', { body: {} });
			await new Promise(resolve => setTimeout(resolve, 20));

			expect(onResponse.mock.calls.length).toBeGreaterThan(heard);
		});
	}
});
