import { createCRUD } from './crud';
import database from '.';

// Only one search engine can be default at a time: the others are unset before a create or update that sets it. Set
// in place rather than through update, which would wait behind the change that's asking; the same write saves both.
const clearDefault = () => {
	for (const engine of Object.values(database.data.searchEngines)) if (engine.default) engine.default = false;
};

export default createCRUD(
	'searchEngines',
	['label', 'url', 'resultsPath', 'nameResultsPath', 'nameProperty', 'urlProperty', 'limit', 'orderBy', 'default'],
	{
		beforeCreate(entry) {
			if (entry.default) clearDefault();
		},
		beforeUpdate(update) {
			if (update.default) clearDefault();
		},
	},
);
