import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import database from '../database/database';
import router from './router';

let tmpDir;
let bookmark;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const dataUri = `data:image/png;base64,${PNG.toString('base64')}`;

const call = (method, path, body, headers = {}) =>
	router(
		new Request(`http://localhost${path}`, {
			method,
			headers: { ...(body !== undefined && { 'content-type': 'application/json' }), ...headers },
			...(body !== undefined && { body: JSON.stringify(body) }),
		}),
	);

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'favicon-route-test-'));
	await database.init({ path: join(tmpDir, 'db.json') });
	bookmark = await (await call('POST', '/bookmarks', { name: 'Icon', url: 'https://icon.test' })).json();
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe('favicon routes', () => {
	test('a stored favicon is served to be revalidated, and answered 304 when the browser already holds it', async () => {
		expect((await call('PUT', `/bookmarks/${bookmark.id}/favicon`, { dataUri })).status).toBe(200);

		const first = await call('GET', `/bookmarks/${bookmark.id}/favicon`);

		expect(first.status).toBe(200);
		expect(first.headers.get('Cache-Control')).toBe('no-cache');
		expect(first.headers.get('Content-Type')).toBe('image/png');
		expect(Buffer.from(await first.arrayBuffer())).toEqual(PNG);

		const etag = first.headers.get('ETag');
		const again = await call('GET', `/bookmarks/${bookmark.id}/favicon`, undefined, { 'If-None-Match': etag });

		expect(again.status).toBe(304);
	});

});
