import { describe, test, expect } from 'bun:test';

import router from './router';

describe('router', () => {
	test('serves the bookmarks view at a lowercase path', () => {
		expect(Object.keys(router.options.views)).toEqual(['/bookmarks']);
	});

	// A home page set to the old #/Bookmarks still opens: an unknown path goes to the default
	test('the old capitalized path falls back to the default', () => {
		expect(router.options.views['/Bookmarks']).toBeUndefined();
		expect(router.options.defaultPath).toBe('/bookmarks');
	});
});
