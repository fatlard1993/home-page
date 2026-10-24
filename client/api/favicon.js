import { readFile, GET, PUT, DELETE } from '@vanilla-bean/components';

export const getFaviconPreview = async url =>
	GET('/favicon-preview', { searchParameters: { url }, cacheId: `faviconPreview:${url}` });

// Uncached snapshot read: callers (undo flows) grab the bytes immediately before a deletion
// removes them server-side, so a stale cache entry would defeat the point.
export const getBookmarkFaviconDataUri = async id => {
	const { status, body } = await GET('/bookmarks/:id/favicon', {
		urlParameters: { id },
		responseType: 'blob',
		cache: false,
	});

	if (status !== 'success') return null;

	return await readFile(body, 'dataURL').catch(() => null);
};

export const setBookmarkFaviconFromDataUri = async (id, dataUri, options) =>
	await PUT('/bookmarks/:id/favicon', {
		invalidates: ['bookmarks'],
		urlParameters: { id },
		body: { dataUri },
		...options,
	});

export const deleteBookmarkFavicon = async (id, options) =>
	await DELETE('/bookmarks/:id/favicon', { invalidates: ['bookmarks'], urlParameters: { id }, ...options });
