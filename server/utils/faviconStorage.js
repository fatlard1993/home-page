import fs from 'fs/promises';
import path from 'path';

import database from '../database';

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
