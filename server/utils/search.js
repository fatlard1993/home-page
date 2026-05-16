import searchEnginesDb from '../database/searchEngines';

import defaultEngines from './defaultEngines';

export const seedEngines = async () => {
	const existing = searchEnginesDb.read();

	if (Object.keys(existing).length === 0) {
		for (const engine of defaultEngines) await searchEnginesDb.create(engine);
	}
};

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export const searchProvider = async (providerId, term) => {
	const engine = searchEnginesDb.read({ id: providerId });

	if (!engine) return [];

	const url = engine.url.replace(':term', encodeURIComponent(term));

	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`Invalid search engine URL: ${url}`);
	}

	if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
		throw new Error(`Disallowed protocol: ${parsed.protocol}`);
	}

	const response = await fetch(url);

	if (!response.ok) throw new Error(`Search API returned ${response.status}: ${response.statusText}`);

	const json = await response.json();

	const results = json[engine.resultsPath] || [];
	const nameResults = engine.nameResultsPath ? json[engine.nameResultsPath] || [] : null;

	const mapped = results.slice(0, engine.limit || 5).map((item, index) => {
		let name = item;

		if (nameResults) name = nameResults[index] || item;
		else if (engine.nameProperty) name = item[engine.nameProperty];

		return {
			name,
			url: engine.urlProperty ? item[engine.urlProperty] : item,
		};
	});

	if (engine.orderBy && engine.orderBy in mapped[0]) {
		mapped.sort((a, b) => String(a[engine.orderBy]).localeCompare(String(b[engine.orderBy])));
	}

	return mapped;
};
