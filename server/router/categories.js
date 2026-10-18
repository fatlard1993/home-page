import { requestMatch } from '@vanilla-bean/components/app';

import categories from '../database/categories';

const categoriesRouter = async request => {
	let match;

	// The whole collection: a ?id= search param doesn't narrow it, /:id below does
	match = requestMatch('GET', '/categories', request);
	if (match) return Response.json(categories.read());

	match = requestMatch('POST', '/categories', request);
	if (match) return Response.json(await categories.create(await request.json()), { status: 201 });

	match = requestMatch('GET', '/categories/:id', request);
	if (match) {
		const item = categories.read(match);

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('PATCH', '/categories/:id', request);
	if (match) {
		const item = await categories.update({ ...match, update: await request.json() });

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/categories/:id', request);
	if (match) return new Response(null, { status: (await categories.delete(match)) ? 204 : 404 });
};

export default categoriesRouter;
