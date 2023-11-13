import categories from '../database/categories';

import requestMatch from '../utils/requestMatch';

export default async request => {
	let match;

	match = requestMatch('GET', '/categories', request);
	if (match) return Response.json(categories.read(match));

	match = requestMatch('POST', '/categories', request);
	if (match) return Response.json(categories.create(await request.json()), { status: 201 });

	match = requestMatch('GET', '/categories/:id', request);
	if (match) {
		const item = categories.read(match);

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('PUT', '/categories/:id', request);
	if (match) {
		const item = categories.update({ ...match, update: await request.json() });

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/categories/:id', request);
	if (match) return new Response(null, { status: categories.delete(match) ? 204 : 404 });
};
