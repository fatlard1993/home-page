const requestMatch = (method, pattern, request) => {
	if (method !== request.method) return false;

	const path = new URL(request.url).pathname;

	if (!pattern.includes(':')) return path === pattern;

	const regex = new RegExp(pattern.replaceAll('/', '\\/').replaceAll(/:.+/g, '([^/]+)'));
	const keys = regex
		.exec(pattern)
		.slice(1)
		.map(key => key.slice(1));
	const values = regex.exec(path)?.slice(1);

	return values ? Object.fromEntries(keys.map((key, index) => [key, decodeURI(values[index])])) : false;
};

export default requestMatch;
