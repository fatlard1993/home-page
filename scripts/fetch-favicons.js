// One pass over the bookmarks, fetching a favicon for every one that has
// none on disk. A machine seeded from another's json (or a fresh symlink
// into a config repo) starts with bookmark entries whose favicon content
// types name bytes that never traveled - icons render broken until each
// site is re-visited through the edit UI. Idempotent and network-tolerant:
// a dark site is skipped and retried on the next run.
//
// HOME_PAGE_DB overrides the database path, so a dev machine can fetch
// into another profile's tree (a symlinked db resolves its favicons dir
// beside the real file, where a config repo can carry the icons along).

import os from 'os';
import path from 'path';

import database from '../server/database/database';
import { fetchFaviconDataUri } from '../server/utils/faviconColor';
import { saveFavicon, readFavicon } from '../server/utils/faviconStorage';

await database.init({ path: process.env.HOME_PAGE_DB || path.join(os.homedir(), '.homePage.json') });

const bookmarks = Object.entries(database.db.data.bookmarks || {});
let fetched = 0;
let present = 0;
let unreachable = 0;

for (const [id, bookmark] of bookmarks) {
	if (!bookmark.url?.startsWith('http')) continue;

	if (await readFavicon(id)) {
		present++;
		continue;
	}

	try {
		const dataUri = await fetchFaviconDataUri(bookmark.url);

		if (!dataUri) {
			unreachable++;
			continue;
		}

		const [, contentType, base64] = dataUri.match(/^data:([^;]+);base64,(.*)$/) || [];

		if (!base64) {
			unreachable++;
			continue;
		}

		await saveFavicon(id, Buffer.from(base64, 'base64'), contentType);
		bookmark.favicon = contentType;
		fetched++;
		console.log(`  ${bookmark.name}: ${contentType}`);
	} catch {
		unreachable++;
	}
}

await database.write();
console.log(`favicons: ${fetched} fetched, ${present} already present, ${unreachable} unreachable`);
