// One pass over the bookmarks, making every favicon one a browser can draw.
// A machine seeded from another's json (or a fresh symlink into a config
// repo) starts with bookmark entries whose favicon content types name bytes
// that never traveled, and installs older than the byte check hold soft-404
// HTML or icons stored under the wrong type. Each renders broken until
// repaired: missing or non-image files are re-fetched, mislabeled icons are
// relabeled, and unusable bytes with no replacement are cleared. Idempotent
// and network-tolerant: a dark site is skipped and retried on the next run.
//
// HOME_PAGE_DB overrides the database path, so a dev machine can fetch
// into another profile's tree (a symlinked db resolves its favicons dir
// beside the real file, where a config repo can carry the icons along).

import os from 'os';
import path from 'path';

import database from '../server/database/database';
import { repairFavicon } from '../server/utils/repairFavicons';

await database.init({ path: process.env.HOME_PAGE_DB || path.join(os.homedir(), '.homePage.json') });

const counts = { present: 0, relabeled: 0, fetched: 0, discarded: 0, unreachable: 0, skipped: 0 };

for (const [id, bookmark] of Object.entries(database.db.data.bookmarks || {})) {
	const outcome = await repairFavicon(id, bookmark);

	counts[outcome]++;

	if (outcome !== 'present' && outcome !== 'skipped') console.log(`  ${bookmark.name}: ${outcome} ${bookmark.favicon}`);
}

await database.write();
console.log(
	`favicons: ${counts.fetched} fetched, ${counts.relabeled} relabeled, ${counts.discarded} discarded, ${counts.present} already present, ${counts.unreachable} unreachable`,
);
