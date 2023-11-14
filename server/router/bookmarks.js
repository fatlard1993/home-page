import bookmarks from '../database/bookmarks';

import requestMatch from '../utils/requestMatch';

export default async request => {
	let match;

	match = requestMatch('GET', '/bookmarks', request);
	if (match) return Response.json(bookmarks.read());

	match = requestMatch('POST', '/bookmarks', request);
	if (match) return Response.json(bookmarks.create(await request.json()), { status: 201 });

	match = requestMatch('GET', '/bookmarks/:id', request);
	if (match) {
		const item = bookmarks.read(match);

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('PATCH', '/bookmarks/:id', request);
	if (match) {
		const item = bookmarks.update({ ...match, update: await request.json() });

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/bookmarks/:id', request);
	if (match) return new Response(null, { status: bookmarks.delete(match) ? 204 : 404 });
};
