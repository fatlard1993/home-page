import { requestMatch, serveStatic } from '@vanilla-bean/components/app';

import { searchProvider } from '../utils/search';
import { detectBrandColor } from '../utils/brandColor';
import { detectFavicon } from '../utils/faviconColor';

import bookmarksRoutes from './bookmarks';
import categoriesRoutes from './categories';
import searchEnginesRoutes from './searchEngines';

// Every other build asset is content-hashed; the document must always revalidate, or a cached copy
// points at chunk hashes that no longer exist.
const indexResponse = () =>
	new Response(Bun.file('client/build/index.html'), { headers: { 'Cache-Control': 'no-cache' } });

const router = async request => {
	try {
		let match;
		let response;

		match = requestMatch('GET', '/', request);
		if (match) return indexResponse();

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

		response = await serveStatic(request);
		if (response) return response;

		// SPA fallback — serve index.html for unmatched GET requests
		if (request.method === 'GET') return indexResponse();

		return new Response('Not Found', { status: 404 });
	} catch (error) {
		if (error instanceof SyntaxError) return new Response('Invalid JSON', { status: 400 });

		console.error('An error was encountered processing a request\n', error);

		return new Response('Server Error', { status: 500 });
	}
};
export default router;
