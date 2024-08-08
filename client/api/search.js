import { GET } from 'vanilla-bean-components';

export const getSearchResults = async (term, options) =>
	await GET('/search/:term', {
		enabled: !!term && (options?.enabled ?? true),
		urlParameters: { term: encodeURIComponent(term) },
		...options,
	});
