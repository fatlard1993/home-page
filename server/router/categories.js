import categories from '../database/categories';

import requestMatch from '../utils/requestMatch';

export default async request => {
	let match;

	match = requestMatch('GET', '/categories', request);
	if (match) return Response.json(categories.read());

	match = requestMatch('POST', '/categories', request);
	if (match) {
		const { id } = categories.create(await request.json());

		return Response.json({ id });
	}

	match = requestMatch('GET', '/categories/:id', request);
	if (match) return Response.json(categories.read(match));

	match = requestMatch('PUT', '/categories/:id', request);
	if (match) {
		categories.update({ ...match, update: await request.json() });

		return Response.json(match);
	}

	match = requestMatch('DELETE', '/categories/:id', request);
	if (match) {
		categories.delete(match);

		return Response.json(match);
	}
};
