import { createCRUD } from './crud';

export default createCRUD('searchEngines', [
	'label',
	'url',
	'resultsPath',
	'nameResultsPath',
	'nameProperty',
	'urlProperty',
	'limit',
	'orderBy',
]);

