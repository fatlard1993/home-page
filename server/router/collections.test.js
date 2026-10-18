import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import database from '../database/database';
import router from './router';

let tmpDir;

const call = (method, path, body) =>
	router(
		new Request(`http://localhost${path}`, {
			method,
			...(body && { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
		}),
	);

beforeAll(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), 'collections-test-'));
	await database.init({ path: join(tmpDir, 'db.json') });
});

afterAll(() => rm(tmpDir, { recursive: true, force: true }));

describe('collection routes', () => {
	// Search engines go through the same crudRoutes, but search.test.js mocks their module for the whole run
	for (const path of ['/bookmarks', '/categories']) {
		test(`${path}: an inherited key is not found, and changing one touches nothing`, async () => {
			const before = JSON.stringify(database.db.data);

			for (const id of ['__proto__', 'toString', 'constructor']) {
				expect((await call('GET', `${path}/${id}`)).status).toBe(404);
				expect((await call('PATCH', `${path}/${id}`, { name: 'x', polluted: true })).status).toBe(404);
				expect((await call('DELETE', `${path}/${id}`)).status).toBe(404);
			}

			expect(JSON.stringify(database.db.data)).toBe(before);
			expect({}.polluted).toBeUndefined();
		});

		test(`${path}: the list ignores an ?id= search param`, async () => {
			const response = await call('GET', `${path}?id=toString`);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(database.db.data[path.slice(1)]);
		});
	}
});
