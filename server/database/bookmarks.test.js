import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

// The store is the real trust boundary (see bookmarks.js): the client neutralizes script-scheme
// URLs on render, but any LAN device can POST/PATCH straight past it. These tests go through the
// CRUD hooks rather than the guard function directly, because the hooks are the wiring that has
// to hold -- a perfect guard nothing calls protects nothing.
let tmpDir;
let bookmarks;

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'bookmarks-test-'));
	const database = (await import('./database.js')).default;
	await database.init({ path: join(tmpDir, 'db.json') });
	database.db.data.bookmarks = {};
	database.db.data.categories = {};
	await database.db.write();
	bookmarks = (await import('./bookmarks.js')).default;
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe('url scheme guard', () => {
	test('a javascript: url is refused at create', () => {
		expect(bookmarks.create({ name: 'evil', url: 'javascript:alert(1)' })).rejects.toThrow(/Unsupported URL scheme/);
	});

	test('an obfuscated scheme -- leading space, interior tab -- is still refused', () => {
		// The browser's URL parser strips these before reading the scheme, so the stored string
		// would reach the href sink as a live javascript: URL. The guard has to see through it.
		expect(bookmarks.create({ name: 'sneaky', url: ' java\tscript:alert(1)' })).rejects.toThrow(/Unsupported URL scheme/);
	});

	test('data: is refused like any non-http scheme', () => {
		expect(bookmarks.create({ name: 'datauri', url: 'data:text/html,<script>1</script>' })).rejects.toThrow(/Unsupported URL scheme/);
	});

	test('an https url passes', async () => {
		const entry = await bookmarks.create({ name: 'ok', url: 'https://example.test/page' });
		expect(entry.url).toBe('https://example.test/page');
	});

	test('host:port is a port, not a scheme', async () => {
		// Matches the client's port-vs-scheme handling: `:` followed by a digit carries no scheme
		// to abuse, so a LAN shortcut like htpc:8033 stays storable.
		const entry = await bookmarks.create({ name: 'lan', url: 'htpc:8033' });
		expect(entry.url).toBe('htpc:8033');
	});

	test('schemeless search text passes untouched', async () => {
		const entry = await bookmarks.create({ name: 'search', url: 'just some words' });
		expect(entry.url).toBe('just some words');
	});

	test('update is guarded the same way create is', async () => {
		const entry = await bookmarks.create({ name: 'flip', url: 'https://fine.test' });
		expect(bookmarks.update({ id: entry.id, update: { url: 'javascript:alert(1)' } })).rejects.toThrow(/Unsupported URL scheme/);
	});
});
