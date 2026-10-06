import { fetchFaviconDataUri } from './faviconColor';
import { saveFavicon, deleteFavicon, readFavicon } from './faviconStorage';
import { sniffImageType } from './imageType';

// One bookmark's favicon brought to a state a browser can draw. A stored file
// only counts if its bytes are an image: entries saved before fetches were
// byte-checked can hold soft-404 HTML, or a real icon under the type the far
// end claimed. The bytes are the truth, so a good icon under the wrong label
// is relabeled in place rather than re-fetched.
//
// Returns what happened: 'present', 'relabeled', 'fetched', 'discarded'
// (unusable bytes, nothing to replace them with), 'unreachable' or 'skipped'.
export const repairFavicon = async (id, bookmark, { fetchDataUri = fetchFaviconDataUri } = {}) => {
	const stored = await readFavicon(id);
	const storedType = stored && sniffImageType(stored);

	if (storedType) {
		if (bookmark.favicon === storedType) return 'present';

		bookmark.favicon = storedType;

		return 'relabeled';
	}

	const fetched = bookmark.url?.startsWith('http') ? await fetchImage(bookmark.url, fetchDataUri) : null;

	if (fetched) {
		await saveFavicon(id, fetched.buffer, fetched.contentType);
		bookmark.favicon = fetched.contentType;

		return 'fetched';
	}

	// Garbage on disk is worse than nothing: it renders broken and blocks the
	// presence check. Clearing the field lets the bookmark fall back to its
	// name; the next run tries the site again.
	if (stored) {
		await deleteFavicon(id);
		bookmark.favicon = '';

		return 'discarded';
	}

	return bookmark.url?.startsWith('http') ? 'unreachable' : 'skipped';
};

const fetchImage = async (url, fetchDataUri) => {
	try {
		const dataUri = await fetchDataUri(url);
		const [, base64] = dataUri?.match(/^data:[^;,]+;base64,(.*)$/) || [];

		if (!base64) return null;

		const buffer = Buffer.from(base64, 'base64');
		const contentType = sniffImageType(buffer);

		return contentType ? { buffer, contentType } : null;
	} catch {
		return null;
	}
};
