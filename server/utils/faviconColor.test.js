import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

import { detectFavicon } from './faviconColor';

// fetch is stubbed with a tiny router: the test preload registers happy-dom, whose fetch enforces
// browser CORS and whose AbortSignal Bun's native fetch rejects, so a real socket isn't reachable.
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

const sites = {
	'https://with-icon.test': {
		'/': '<html><head><link rel="icon" href="/icon.png"></head></html>',
		'/icon.png': PNG,
	},
	// No declared icon, and /favicon.ico answers 200 with an html page: the common soft 404.
	'https://soft-404.test': {
		'/': '<html><head></head></html>',
		'/favicon.ico': '<!doctype html><html>Not Found</html>',
	},
	// The page answers but the icon request never does.
	'https://icon-times-out.test': {
		'/': '<html><head><link rel="icon" href="/icon.png"></head></html>',
		'/icon.png': new TypeError('timed out'),
	},
};

let domFetch;

beforeAll(() => {
	domFetch = globalThis.fetch;
	globalThis.fetch = async input => {
		const { origin, pathname } = new URL(input);
		const body = sites[origin]?.[pathname];

		if (body instanceof Error) throw body;
		if (!sites[origin]) throw new TypeError('connection refused');

		return new Response(body ?? 'Not Found', { status: body === undefined ? 404 : 200 });
	};
});

afterAll(() => {
	globalThis.fetch = domFetch;
});

describe('detectFavicon', () => {
	test('a declared icon that answers with image bytes is found', async () => {
		const { status, dataUri } = await detectFavicon('https://with-icon.test/');

		expect(status).toBe('found');
		expect(dataUri).toStartWith('data:image/png;base64,');
	});

	test('a site whose /favicon.ico answers with an html page has none', async () => {
		expect(await detectFavicon('https://soft-404.test/')).toEqual({ status: 'none', dataUri: null });
	});

	test('a site that never answers is unreachable, not iconless', async () => {
		expect(await detectFavicon('https://down.test/')).toEqual({ status: 'unreachable', dataUri: null });
	});

	test('an icon request that fails in transit is unreachable, not iconless', async () => {
		expect(await detectFavicon('https://icon-times-out.test/')).toEqual({ status: 'unreachable', dataUri: null });
	});
});
