import { requestMatch, serveApp } from '@vanilla-bean/components/app';

import { searchProvider } from '../utils/search';
import { detectBrandColor } from '../utils/brandColor';
import { detectFavicon } from '../utils/faviconColor';

import bookmarksRoutes from './bookmarks';
import categoriesRoutes from './categories';
import searchEnginesRoutes from './searchEngines';

const router = async request => {
	let match;
	let response;

	response = await bookmarksRoutes(request);
	if (response) return response;

	response = await categoriesRoutes(request);
	if (response) return response;

	response = await searchEnginesRoutes(request);
	if (response) return response;

	match = requestMatch('GET', '/search/:provider/:term', request);
	if (match) {
		try {
			const results = await searchProvider(match.provider, match.term);

			if (!results) return new Response('Provider not found', { status: 404 });

			return Response.json(results);
		} catch (error) {
			console.error(error);

			return new Response('Search Failed', { status: 500 });
		}
	}

	match = requestMatch('GET', '/brand-color', request);
	if (match) return Response.json({ color: await detectBrandColor(match.url) });

	match = requestMatch('GET', '/favicon-preview', request);
	if (match) return Response.json(await detectFavicon(match.url));

	// The page, revalidated on every load, the built files, and the page again for the client's own routes
	return serveApp(request, { api: false });
};

export default router;
