const websiteRegex = /^(.+:\/\/)?[\da-z]+([.-][\da-z]+)*\.[a-z]{2,5}(:\d{1,5})?(\/.*)?$/;
const ipRegex =
	/^(.+:\/\/)?(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})(:\d{1,5})?(\/.*)?$/;
const hostnameRegex = /^(.+:\/\/)[^:]+?(:\d{1,5})?(\/.*)?$/;
const localhostRegex = /^(.+:\/\/)?localhost(:\d{1,5})?(\/.*)?$/;

export const isLink = url =>
	websiteRegex.test(url) || ipRegex.test(url) || localhostRegex.test(url) || hostnameRegex.test(url);

// localStorage is shared, writable state: a corrupt or non-array value must degrade to "no recent
// colors", not throw from every reader (the batch bar reads this during page build).
export const getRecentColors = () => {
	try {
		const parsed = JSON.parse(localStorage.getItem('recentColors'));

		return Array.isArray(parsed) ? parsed.filter(color => typeof color === 'string' && color) : [];
	} catch {
		return [];
	}
};

export const saveRecentColor = color => {
	if (!color || color === 'random') return;

	const recentColors = [...new Set([color, ...getRecentColors()])];
	recentColors.length = Math.min(recentColors.length, 10);
	localStorage.setItem('recentColors', JSON.stringify(recentColors));
};

export const validateForm = form => {
	document.activeElement?.blur();
	return form.hasErrors();
};

// Falls back to current position for items never explicitly reordered. The CRUD layer defaults
// unset fields to '' rather than undefined, so anything non-numeric counts as unset.
export const sortedIds = collection => {
	const ids = Object.keys(collection);
	const effectiveOrder = id => (typeof collection[id].order === 'number' ? collection[id].order : ids.indexOf(id));

	return [...ids].sort((a, b) => effectiveOrder(a) - effectiveOrder(b));
};

export const batchFieldsChanged = (record, stored) =>
	!stored ||
	(record.category || '') !== (stored.category || '') ||
	record.order !== stored.order ||
	(record.color || '') !== (stored.color || '');

export const fixLink = url => {
	const search = `http://google.com/search?q=${encodeURIComponent(url)}`;

	if (!isLink(url)) return search;

	const candidate = /.+:\/\//.test(url) ? url : `http://${url}`;

	// A regex scheme test can be evaded: the browser resolves an href with the WHATWG URL parser,
	// which trims leading control chars and strips interior tabs/newlines before reading the
	// scheme, so ` javascript:` and `java\tscript:` reach the sink as live javascript: URLs.
	// Parsing here the same way the sink will is what neutralizes them — only a scheme that resolves
	// to http(s) is handed back; anything else (javascript:, data:, or a value the parser rejects)
	// falls to search.
	try {
		const { protocol } = new URL(candidate);

		if (protocol === 'http:' || protocol === 'https:') return candidate;
	} catch {
		// Not a valid URL — treat as a search term.
	}

	return search;
};
