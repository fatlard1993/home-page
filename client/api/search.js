import { GET, POST, PATCH, DELETE } from 'vanilla-bean-components';

export const getSearchEngines = async options =>
	await GET('/search/engines', {
		cacheId: 'search:engines',
		...options,
	});

export const createSearchEngine = async options =>
	await POST('/search/engines', { invalidates: ['search:engines'], ...options });

export const updateSearchEngine = async (id, options) =>
	await PATCH('/search/engines/:id', { invalidates: ['search:engines'], urlParameters: { id }, ...options });

export const deleteSearchEngine = async (id, options) =>
	await DELETE('/search/engines/:id', { invalidates: ['search:engines'], urlParameters: { id }, ...options });

export const getSearchResult = async (provider, term, options) =>
	await GET('/search/:provider/:term', {
		id: `search:${provider}`,
		enabled: !!term && (options?.enabled ?? true),
		urlParameters: { provider, term },
		cacheId: ({ urlParameters }) => `search:${urlParameters.provider}:${urlParameters.term}`,
		...options,
	});
