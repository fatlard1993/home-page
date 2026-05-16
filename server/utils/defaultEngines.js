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
];

export default searchEngines;
