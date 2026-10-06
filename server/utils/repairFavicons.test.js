import { mkdtemp, rm, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

// Installs that saved favicons before fetches were byte-checked hold HTML
// soft-404s and mislabeled icons. These go through the real storage dir so the
// on-disk outcome is what's asserted, not just the returned label.
let tmpDir;
let database;
let repairFavicon;
let readStoredFavicon;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const ICO = Buffer.from([0x00, 0x00, 0x01, 0x00, 1, 0]);
const HTML = Buffer.from('<!doctype html><html><body>Not Found</body></html>');

const pngDataUri = `data:image/png;base64,${PNG.toString('base64')}`;
const never = () => {
	throw new Error('should not fetch');
};

const store = (id, buffer) => writeFile(join(database.faviconsDir, id), buffer);
const exists = id =>
	access(join(database.faviconsDir, id)).then(
		() => true,
		() => false,
	);

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'repair-favicons-test-'));
	database = (await import('../database/database.js')).default;
	await database.init({ path: join(tmpDir, 'db.json') });
	({ repairFavicon } = await import('./repairFavicons.js'));
	({ readStoredFavicon } = await import('./faviconStorage.js'));
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe('repairFavicon', () => {
	test('a correctly labeled image is left alone without touching the network', async () => {
		await store('ok', PNG);
		const bookmark = { url: 'https://ok.test', favicon: 'image/png' };

		expect(await repairFavicon('ok', bookmark, { fetchDataUri: never })).toBe('present');
		expect(bookmark.favicon).toBe('image/png');
	});

	test('an icon stored as application/octet-stream is relabeled from its bytes, not re-fetched', async () => {
		await store('octet', ICO);
		const bookmark = { url: 'https://octet.test', favicon: 'application/octet-stream' };

		expect(await repairFavicon('octet', bookmark, { fetchDataUri: never })).toBe('relabeled');
		expect(bookmark.favicon).toBe('image/x-icon');
	});

	test('a stored soft-404 html page counts as absent and is replaced by a fresh fetch', async () => {
		await store('soft404', HTML);
		const bookmark = { url: 'https://soft404.test', favicon: 'text/html' };

		expect(await repairFavicon('soft404', bookmark, { fetchDataUri: async () => pngDataUri })).toBe('fetched');
		expect(bookmark.favicon).toBe('image/png');
		expect(await readFile(join(database.faviconsDir, 'soft404'))).toEqual(PNG);
	});

	test('unusable bytes with no replacement are deleted and the field cleared, so the name shows instead', async () => {
		await store('dead', HTML);
		const bookmark = { url: 'https://dead.test', favicon: 'text/html' };

		expect(await repairFavicon('dead', bookmark, { fetchDataUri: async () => null })).toBe('discarded');
		expect(bookmark.favicon).toBe('');
		expect(await exists('dead')).toBe(false);
	});

	test('a fetch that answers with a non-image data uri is not trusted on its declared type', async () => {
		const bookmark = { url: 'https://liar.test', favicon: 'image/png' };
		const liar = async () => `data:image/png;base64,${HTML.toString('base64')}`;

		expect(await repairFavicon('liar', bookmark, { fetchDataUri: liar })).toBe('unreachable');
		expect(await exists('liar')).toBe(false);
	});

	test('a missing file on a seeded db is fetched', async () => {
		const bookmark = { url: 'https://seeded.test', favicon: 'image/png' };

		expect(await repairFavicon('seeded', bookmark, { fetchDataUri: async () => pngDataUri })).toBe('fetched');
		expect(await exists('seeded')).toBe(true);
	});

	test('a fetch that throws is reported unreachable, not fatal', async () => {
		const bookmark = { url: 'https://down.test', favicon: 'image/png' };

		expect(
			await repairFavicon('down', bookmark, {
				fetchDataUri: async () => {
					throw new Error('ECONNREFUSED');
				},
			}),
		).toBe('unreachable');
	});
});

describe('readStoredFavicon', () => {
	test('reports the sniffed type rather than any stored label', async () => {
		await store('typed', ICO);

		expect((await readStoredFavicon('typed')).contentType).toBe('image/x-icon');
	});

	test('a stored non-image reads as absent', async () => {
		await store('html', HTML);

		expect(await readStoredFavicon('html')).toBeNull();
	});
});
