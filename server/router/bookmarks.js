import bookmarks from '../database/bookmarks';

import requestMatch from '../utils/requestMatch';

export default async request => {
	let match;

	match = requestMatch('GET', '/bookmarks', request);
	if (match) return Response.json(bookmarks.read());

	match = requestMatch('POST', '/bookmarks', request);
	if (match) {
		const { id } = bookmarks.create(await request.json());

		return Response.json({ id });
	}

	match = requestMatch('GET', '/bookmarks/:id', request);
	if (match) return Response.json(bookmarks.read(match));

	match = requestMatch('PUT', '/bookmarks/:id', request);
	if (match) {
		bookmarks.update({ ...match, update: await request.json() });

		return Response.json(match);
	}

	match = requestMatch('DELETE', '/bookmarks/:id', request);
	if (match) {
		bookmarks.delete(match);

		return Response.json(match);
	}
};
