import { createStore } from '@vanilla-bean/components/app';

import database from '.';

// Only one search engine can be default at a time: the others are unset before a create or update that sets it. Set
// in place rather than through update, which would wait behind the change that's asking; the same write saves both.
const clearDefault = () => {
	for (const engine of Object.values(database.data.searchEngines)) if (engine.default) engine.default = false;
};

export default createStore({
	db: database,
	collection: 'searchEngines',
	fields: [
		'label',
		'url',
		'resultsPath',
		'nameResultsPath',
		'nameProperty',
		'urlProperty',
		'limit',
		'orderBy',
		'default',
	],
	hooks: {
		beforeCreate(entry) {
			if (entry.default) clearDefault();
		},
		beforeUpdate(update) {
			if (update.default) clearDefault();
		},
	},
});
