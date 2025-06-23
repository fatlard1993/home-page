const search = async term => {
	let google = await fetch(`http://suggestqueries.google.com/complete/search?client=chrome&q=${term}`);
	google = await google.json();
	google = google?.[1];

	let stardew = await fetch(
		`https://stardewvalleywiki.com/mediawiki/api.php?action=opensearch&format=json&formatversion=2&search=${term}&namespace=0&limit=10`,
	);
	stardew = await stardew.json();
	stardew = stardew?.[3];

	let scryfall = await fetch(`https://api.scryfall.com/cards/search?q=${term}&limit=10`);
	scryfall = await scryfall.json();
	scryfall = scryfall?.data?.slice(0, 10);

	return { google, stardew, scryfall };
};

export default search;
