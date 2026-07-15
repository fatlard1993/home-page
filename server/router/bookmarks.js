import bookmarks from '../database/bookmarks';
import { saveFavicon, deleteFavicon, readFavicon } from '../utils/faviconStorage';

import requestMatch from '../utils/requestMatch';

const MAX_UPLOAD_BYTES = 3_000_000;

const bookmarksRouter = async request => {
	let match;

	match = requestMatch('GET', '/bookmarks', request);
	if (match) return Response.json(bookmarks.read());

	match = requestMatch('POST', '/bookmarks', request);
	if (match) return Response.json(await bookmarks.create(await request.json()), { status: 201 });

	match = requestMatch('GET', '/bookmarks/:id/favicon', request);
	if (match) {
		const item = bookmarks.read(match);
		const buffer = item?.favicon ? await readFavicon(match.id) : null;

		if (!buffer) return new Response(null, { status: 404 });

		return new Response(buffer, { headers: { 'Content-Type': item.favicon } });
	}

	match = requestMatch('PUT', '/bookmarks/:id/favicon', request);
	if (match) {
		if (!bookmarks.read(match)) return new Response(null, { status: 404 });

		const { dataUri } = await request.json();
		const dataUriMatch = dataUri && /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/.exec(dataUri);

		if (!dataUriMatch) return new Response('Expected a JSON { dataUri } body', { status: 400 });

		const imageContentType = dataUriMatch[1];
		const imageBuffer = Buffer.from(dataUriMatch[2], 'base64');

		if (imageBuffer.length > MAX_UPLOAD_BYTES) return new Response('Image too large', { status: 413 });

		await saveFavicon(match.id, imageBuffer, imageContentType);

		const item = await bookmarks.update({ id: match.id, update: { favicon: imageContentType } });

		return Response.json(item);
	}

	match = requestMatch('DELETE', '/bookmarks/:id/favicon', request);
	if (match) {
		if (!bookmarks.read(match)) return new Response(null, { status: 404 });

		await deleteFavicon(match.id);

		const item = await bookmarks.update({ id: match.id, update: { favicon: '' } });

		return Response.json(item);
	}

	match = requestMatch('GET', '/bookmarks/:id', request);
	if (match) {
		const item = bookmarks.read(match);

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('PATCH', '/bookmarks/:id', request);
	if (match) {
		const item = await bookmarks.update({ ...match, update: await request.json() });

		return item ? Response.json(item) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/bookmarks/:id', request);
	if (match) return new Response(null, { status: (await bookmarks.delete(match)) ? 204 : 404 });
};

export default bookmarksRouter;
