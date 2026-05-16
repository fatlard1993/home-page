import { nanoid } from 'nanoid';

import { searchProvider } from '../utils/search';
import requestMatch from '../utils/requestMatch';

import bookmarksRoutes from './bookmarks';
import categoriesRoutes from './categories';
import searchEnginesRoutes from './searchEngines';
import staticRoutes from './static';

const router = async (request, server) => {
	try {
		let match;
		let response;

		match = requestMatch('GET', '/', request);
		if (match) return new Response(Bun.file('client/build/index.html'));

		if (process.env.NODE_ENV === 'development') {
			match = requestMatch('GET', '/ws', request);
			if (match) {
				const success = server.upgrade(request, { data: { clientId: nanoid() } });

				return success ? undefined : new Response('WebSocket upgrade error', { status: 400 });
			}
		}

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

		response = await staticRoutes(request);
		if (response) return response;

		// SPA fallback — serve index.html for unmatched GET requests
		if (request.method === 'GET') return new Response(Bun.file('client/build/index.html'));

		return new Response('Not Found', { status: 404 });
	} catch (error) {
		if (error instanceof SyntaxError) return new Response('Invalid JSON', { status: 400 });

		console.error('An error was encountered processing a request\n', error);

		return new Response('Server Error', { status: 500 });
	}
};
export default router;
