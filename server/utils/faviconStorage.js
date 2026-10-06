import fs from 'fs/promises';
import path from 'path';

import database from '../database';
import { sniffImageType } from './imageType';

const filePath = id => path.join(database.faviconsDir, id);

export const saveFavicon = async (id, buffer, contentType) => {
	await fs.writeFile(filePath(id), buffer);

	return contentType;
};

export const deleteFavicon = async id => {
	try {
		await fs.unlink(filePath(id));
	} catch {
		// already gone, nothing to do
	}
};

export const readFavicon = async id => {
	try {
		const buffer = await fs.readFile(filePath(id));

		return buffer;
	} catch {
		return null;
	}
};

// Favicons saved before fetches were byte-checked can be soft-404 HTML pages,
// or real icons labeled with whatever type the far end claimed (commonly
// application/octet-stream). The stored type can't be trusted for those, so
// the bytes decide here too: a stored file that isn't an image reads as absent.
export const readStoredFavicon = async id => {
	const buffer = await readFavicon(id);
	const contentType = buffer && sniffImageType(buffer);

	return contentType ? { buffer, contentType } : null;
};
