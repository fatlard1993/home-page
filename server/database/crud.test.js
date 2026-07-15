import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';

let tmpDir;
let database;
let items;

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'crud-test-'));
	database = (await import('./database.js')).default;
	await database.init({ path: join(tmpDir, 'db.json') });
	// Ensure the test collection exists in the database
	database.db.data.testItems = {};
	await database.db.write();
	const { createCRUD } = await import('./crud.js');
	items = createCRUD('testItems', ['name', 'url']);
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

beforeEach(() => {
	const data = database.db.data.testItems;
	if (data) for (const key of Object.keys(data)) delete data[key];
});

describe('createCRUD', () => {
	describe('create', () => {
		test('returns a new entry with an id', async () => {
			const entry = await items.create({ name: 'Test', url: 'https://test.com' });
			expect(entry.id).toBeDefined();
			expect(entry.name).toBe('Test');
			expect(entry.url).toBe('https://test.com');
		});

		test('defaults missing fields to empty string', async () => {
			const entry = await items.create({ name: 'Only name' });
			expect(entry.url).toBe('');
		});

		test('ignores fields not in the schema', async () => {
			const entry = await items.create({ name: 'Test', url: 'x', secret: 'nope' });
			expect(entry).not.toHaveProperty('secret');
		});

		test('persists the entry', async () => {
			const entry = await items.create({ name: 'Persistent', url: 'x' });
			expect(items.read({ id: entry.id })).toEqual(entry);
		});
	});

	describe('read', () => {
		test('returns all entries when called with no id', async () => {
			await items.create({ name: 'A', url: 'a' });
			await items.create({ name: 'B', url: 'b' });
			const all = items.read();
			expect(Object.keys(all)).toHaveLength(2);
		});

		test('returns false for unknown id', () => {
			expect(items.read({ id: 'nonexistent' })).toBe(false);
		});
	});

	describe('update', () => {
		test('updates only the specified fields', async () => {
			const entry = await items.create({ name: 'Original', url: 'https://orig.com' });
			const updated = await items.update({ id: entry.id, update: { name: 'Changed' } });
			expect(updated.name).toBe('Changed');
			expect(updated.url).toBe('https://orig.com');
		});

		test('returns false for unknown id', async () => {
			expect(await items.update({ id: 'ghost', update: { name: 'x' } })).toBe(false);
		});
	});

	describe('delete', () => {
		test('removes an entry and returns its id', async () => {
			const entry = await items.create({ name: 'ToDelete', url: 'x' });
			const result = await items.delete({ id: entry.id });
			expect(result).toBe(entry.id);
			expect(items.read({ id: entry.id })).toBe(false);
		});

		test('returns false for unknown id', async () => {
			expect(await items.delete({ id: 'ghost' })).toBe(false);
		});
	});
});
