const search = async term => {
	let response = await fetch(`http://suggestqueries.google.com/complete/search?client=chrome&q=${term}`);
	response = await response.json();

	return response?.[1];
};

export default search;
