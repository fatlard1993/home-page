import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';

import searchEnginesDb from '../database/searchEngines';

let searchProvider;
let engines;
let fetchResponse;

const originalFetch = globalThis.fetch;

beforeAll(async () => {
	mock.module('../database/searchEngines', () => ({
		default: { ...searchEnginesDb, read: query => (query?.id ? engines[query.id] : engines) },
	}));

	globalThis.fetch = async () => fetchResponse;

	({ searchProvider } = await import('./search.js'));
});

afterAll(() => {
	globalThis.fetch = originalFetch;
});

beforeEach(() => {
	engines = {};
	fetchResponse = { ok: true, status: 200, statusText: 'OK', json: async () => ({}) };
});

describe('searchProvider', () => {
	test('an unknown engine returns an empty result set', async () => {
		expect(await searchProvider('missing', 'x')).toEqual([]);
	});

	test('a search that matches nothing returns an empty set even with orderBy set', async () => {
		// The order-by branch reads mapped[0] to check for the sort key; an empty result set has no
		// mapped[0], so it must be handled before that read.
		engines.e = { id: 'e', url: 'https://api.example/search?q=:term', resultsPath: 'items', orderBy: 'name' };
		fetchResponse.json = async () => ({ items: [] });

		expect(await searchProvider('e', 'nothing')).toEqual([]);
	});

	test('results normalize to name and url', async () => {
		engines.e = {
			id: 'e',
			url: 'https://api.example/search?q=:term',
			resultsPath: 'items',
			nameProperty: 'title',
			urlProperty: 'link',
		};
		fetchResponse.json = async () => ({ items: [{ title: 'A', link: 'https://a.example' }] });

		expect(await searchProvider('e', 'x')).toEqual([{ name: 'A', url: 'https://a.example' }]);
	});

	test('orderBy sorts the mapped results', async () => {
		engines.e = {
			id: 'e',
			url: 'https://api.example/:term',
			resultsPath: 'items',
			nameProperty: 'name',
			urlProperty: 'url',
			orderBy: 'name',
		};
		fetchResponse.json = async () => ({
			items: [
				{ name: 'b', url: 'https://b.example' },
				{ name: 'a', url: 'https://a.example' },
			],
		});

		expect((await searchProvider('e', 'x')).map(({ name }) => name)).toEqual(['a', 'b']);
	});

	test('a disallowed protocol throws instead of fetching', async () => {
		engines.e = { id: 'e', url: 'ftp://api.example/:term', resultsPath: 'items' };

		await expect(searchProvider('e', 'x')).rejects.toThrow('Disallowed protocol');
	});

	test('a non-2xx response throws', async () => {
		engines.e = { id: 'e', url: 'https://api.example/:term', resultsPath: 'items' };
		fetchResponse = { ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) };

		await expect(searchProvider('e', 'x')).rejects.toThrow('Search API returned 500');
	});
});
