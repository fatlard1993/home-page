import { deleteFavicon } from '../utils/faviconStorage';
import categories from './categories.js';
import { createCRUD } from './crud';

// The store is the real trust boundary: the client neutralizes script-scheme URLs on render, but any
// LAN device can PATCH/POST straight past it. The URL parser strips interior tabs/newlines and
// leading control chars before reading a scheme, so a stored ` javascript:` or `java\tscript:` still
// reaches the browser's href sink as a live scheme — refuse anything scheme-bearing that does not
// parse to http(s). Bare hosts and search text carry no scheme and pass untouched.
const assertSafeUrl = url => {
	if (typeof url !== 'string' || url === '') return;

	const cleaned = [...url].filter(character => character.charCodeAt(0) > 0x20).join('');

	// `:` followed by a digit is a port (host:8123), not a scheme — those carry no scheme to abuse
	// and pass untouched, matching the client's port-vs-scheme handling.
	if (!/^[a-z][a-z\d+.-]*:(?!\d)/i.test(cleaned)) return;

	let protocol;

	try {
		({ protocol } = new URL(cleaned));
	} catch {
		return;
	}

	if (protocol !== 'http:' && protocol !== 'https:') throw new Error(`Unsupported URL scheme: ${protocol}`);
};

export default createCRUD('bookmarks', ['name', 'url', 'color', 'category', 'favicon', 'order'], {
	async beforeCreate(entry, data) {
		assertSafeUrl(entry.url);
		if (data.category?.create) entry.category = (await categories.create(data.category.create)).id;
	},
	async beforeUpdate(update) {
		assertSafeUrl(update.url);
		if (update.category?.create) update.category = (await categories.create(update.category.create)).id;
	},
	async afterDelete(id) {
		await deleteFavicon(id);
	},
});
