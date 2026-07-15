const searchEngines = [
	{
		label: 'Google Search Results',
		url: 'http://suggestqueries.google.com/complete/search?client=chrome&q=:term',
		resultsPath: '1',
		limit: 5,
	},
	{
		label: 'Stardew Wiki Search Results',
		url: 'https://stardewvalleywiki.com/mediawiki/api.php?action=opensearch&format=json&formatversion=2&search=:term&namespace=0&limit=10',
		resultsPath: '3',
		nameResultsPath: '1',
		limit: 5,
	},
	{
		label: 'Scryfall Search Results',
		url: 'https://api.scryfall.com/cards/search?q=:term&limit=10',
		resultsPath: 'data',
		nameProperty: 'name',
		urlProperty: 'scryfall_uri',
		limit: 10,
	},
	{
		label: 'Wikipedia Search Results',
		url: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search=:term&namespace=0&limit=10',
		resultsPath: '3',
		nameResultsPath: '1',
		limit: 5,
	},
	{
		label: 'GitHub Repository Search Results',
		url: 'https://api.github.com/search/repositories?q=:term&per_page=10',
		resultsPath: 'items',
		nameProperty: 'full_name',
		urlProperty: 'html_url',
		limit: 5,
	},
	{
		label: 'NPM Package Search Results',
		url: 'https://registry.npmjs.org/-/v1/search?text=:term&size=10',
		resultsPath: 'objects',
		nameProperty: 'package.name',
		urlProperty: 'package.links.npm',
		limit: 5,
	},
];

export default searchEngines;
