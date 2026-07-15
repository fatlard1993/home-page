import { createCRUD } from './crud';

const searchEngines = createCRUD(
	'searchEngines',
	['label', 'url', 'resultsPath', 'nameResultsPath', 'nameProperty', 'urlProperty', 'limit', 'orderBy', 'default'],
	{
		async beforeCreate(entry) {
			if (entry.default) await searchEngines.clearDefault();
		},
		async beforeUpdate(update) {
			if (update.default) await searchEngines.clearDefault();
		},
	},
);

// Only one search engine can be default at a time — unset any others before the create/update is applied.
searchEngines.clearDefault = async () => {
	for (const [id, engine] of Object.entries(searchEngines.data)) {
		if (engine.default) await searchEngines.update({ id, update: { default: false } });
	}
};

export default searchEngines;
