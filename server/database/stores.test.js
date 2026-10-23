import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';

let tmpDir;
let database;
let bookmarks;
let categories;
let searchEngines;

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'stores-test-'));
	database = (await import('./database.js')).default;
	await database.init({ path: join(tmpDir, 'db.json') });
	bookmarks = (await import('./bookmarks.js')).default;
	categories = (await import('./categories.js')).default;
	searchEngines = (await import('./searchEngines.js')).default;
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

beforeEach(() => {
	for (const collection of Object.values(database.data))
		for (const key of Object.keys(collection)) delete collection[key];
});

describe('stores', () => {
	test('a record holds its fields, missing ones as empty text, then its id, as the file always has', async () => {
		const entry = await bookmarks.create({ name: 'Docs', url: 'https://docs.example', secret: 'dropped' });

		expect(Object.keys(entry)).toEqual(['name', 'url', 'color', 'category', 'favicon', 'order', 'id']);
		expect(entry).toMatchObject({ color: '', category: '', favicon: '', order: '' });

		const onDisk = JSON.parse(await readFile(join(tmpDir, 'db.json'), 'utf8'));

		expect(onDisk.bookmarks[entry.id]).toEqual(entry);
	});

	test('a bookmark can bring a new category with it', async () => {
		const entry = await bookmarks.create({ name: 'Docs', url: 'x.example', category: { create: { name: 'Work' } } });

		expect(categories.read({ id: entry.category }).name).toBe('Work');
	});

	test('deleting a category moves its bookmarks when asked, and deletes them otherwise', async () => {
		const [from, to] = [await categories.create({ name: 'From' }), await categories.create({ name: 'To' })];
		const moved = await bookmarks.create({ name: 'a', category: from.id });

		await categories.delete({ id: from.id, moveTo: to.id });
		expect(bookmarks.read({ id: moved.id }).category).toBe(to.id);

		await categories.delete({ id: to.id });
		expect(bookmarks.read({ id: moved.id })).toBe(false);
	});

	test('a category moved into itself, or into one that is gone, lands its bookmarks in Default', async () => {
		const from = await categories.create({ name: 'From' });
		const toSelf = await bookmarks.create({ name: 'a', category: from.id });

		await categories.delete({ id: from.id, moveTo: from.id });
		expect(bookmarks.read({ id: toSelf.id }).category).toBe('');

		const other = await categories.create({ name: 'Other' });
		const toGone = await bookmarks.create({ name: 'b', category: other.id });

		await categories.delete({ id: other.id, moveTo: 'missing' });
		expect(bookmarks.read({ id: toGone.id }).category).toBe('');
	});

	// Read from the data itself: search.test.js mocks this store's read for the whole run
	test('one search engine is the default at a time', async () => {
		const stored = id => database.data.searchEngines[id];
		const first = await searchEngines.create({ label: 'One', default: true });
		const second = await searchEngines.create({ label: 'Two', default: true });

		expect(stored(first.id).default).toBe(false);
		expect(stored(second.id).default).toBe(true);

		await searchEngines.update({ id: first.id, update: { default: true } });

		expect(stored(first.id).default).toBe(true);
		expect(stored(second.id).default).toBe(false);
	});

	test('keys a plain object inherits are never records', async () => {
		const kept = await categories.create({ name: 'Kept' });

		for (const id of ['__proto__', 'toString', 'constructor', 'hasOwnProperty']) {
			expect(categories.read({ id })).toBe(false);
			expect(await categories.update({ id, update: { name: 'x' } })).toBe(false);
			expect(await categories.delete({ id })).toBe(false);
		}

		expect(Object.keys(categories.data)).toEqual([kept.id]);
		expect({}.polluted).toBeUndefined();
	});
});
