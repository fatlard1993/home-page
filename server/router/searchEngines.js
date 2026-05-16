import searchEngines from '../database/searchEngines';

import requestMatch from '../utils/requestMatch';

const searchEnginesRouter = async request => {
	let match;

	match = requestMatch('GET', '/search/engines', request);
	if (match) return Response.json(searchEngines.read(match));

	match = requestMatch('POST', '/search/engines', request);
	if (match) return Response.json(await searchEngines.create(await request.json()), { status: 201 });

	match = requestMatch('GET', '/search/engines/:id', request);
	if (match) {
		const item = searchEngines.read(match);

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('PATCH', '/search/engines/:id', request);
	if (match) {
		const item = await searchEngines.update({ ...match, update: await request.json() });

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/search/engines/:id', request);
	if (match) return new Response(null, { status: (await searchEngines.delete(match)) ? 204 : 404 });
};

export default searchEnginesRouter;
