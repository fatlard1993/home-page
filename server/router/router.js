import { nanoid } from 'nanoid';

import search from '../utils/search';
import requestMatch from '../utils/requestMatch';

import bookmarksRoutes from './bookmarks';
import categoriesRoutes from './categories';
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

		match = requestMatch('GET', '/search/:term', request);
		if (match) {
			try {
				const suggestions = await search(match.term);

				return Response.json(suggestions);
			} catch (error) {
				console.error(error);

				return new Response('Search Failed', { status: 500 });
			}
		}

		response = await staticRoutes(request);
		if (response) return response;
	} catch (error) {
		console.error('An error was encountered processing a request\n', error);

		return new Response('Server Error', { status: 500 });
	}
};
export default router;
