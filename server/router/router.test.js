import { describe, test, expect } from 'bun:test';

import router from './router';

describe('router', () => {
	test('the index document is served no-cache so a cached copy never points at dead chunk hashes', async () => {
		const response = await router(new Request('http://localhost/'), {});

		expect(response.headers.get('Cache-Control')).toBe('no-cache');
	});
});
