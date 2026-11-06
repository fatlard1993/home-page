import searchEnginesDb from '../database/searchEngines';

import defaultEngines from './defaultEngines';

export const seedEngines = async () => {
	const existing = searchEnginesDb.read();

	if (Object.keys(existing).length === 0) {
		for (const engine of defaultEngines) await searchEnginesDb.create(engine);
	}
};

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const getPath = (item, path) =>
	String(path)
		.split('.')
		.reduce((value, key) => value?.[key], item);

// An engine's orderBy is either a field name or the dialog's { property, direction }; an empty property is no sort
const sortSpec = orderBy => {
	const { property, direction = 'asc' } = typeof orderBy === 'string' ? { property: orderBy } : (orderBy ?? {});

	return property ? { property, direction } : null;
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

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

	// A path that lands anywhere but on a list is an engine set up wrong, which finds nothing rather than failing the search
	const listAt = path => {
		const value = path ? getPath(json, path) : undefined;

		return Array.isArray(value) ? value : [];
	};

	const results = listAt(engine.resultsPath);
	const nameResults = engine.nameResultsPath ? listAt(engine.nameResultsPath) : null;

	const mapped = results.slice(0, Number(engine.limit) || 5).map((item, index) => {
		let name = item;

		if (nameResults) name = nameResults[index] || item;
		else if (engine.nameProperty) name = getPath(item, engine.nameProperty);

		return {
			name,
			url: engine.urlProperty ? getPath(item, engine.urlProperty) : item,
		};
	});

	const sort = sortSpec(engine.orderBy);

	if (sort) {
		const sign = sort.direction === 'desc' ? -1 : 1;

		mapped.sort((a, b) => sign * collator.compare(String(a[sort.property] ?? ''), String(b[sort.property] ?? '')));
	}

	return mapped;
};
