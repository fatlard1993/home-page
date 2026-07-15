import { GET, POST, PATCH, DELETE } from '@vanilla-bean/hypertether';

export const getSearchEngines = async options =>
	await GET('/search/engines', {
		cacheId: 'search:engines',
		// Same reasoning as getBookmarks: invalidation-driven, so the cache entry must outlive the TTL.
		invalidateAfter: false,
		...options,
	});

export const createSearchEngine = async options =>
	await POST('/search/engines', { invalidates: ['search:engines'], ...options });

export const updateSearchEngine = async (id, options) =>
	await PATCH('/search/engines/:id', { invalidates: ['search:engines'], urlParameters: { id }, ...options });

export const deleteSearchEngine = async (id, options) =>
	await DELETE('/search/engines/:id', { invalidates: ['search:engines'], urlParameters: { id }, ...options });

export const getSearchResult = async (provider, term, options) => {
	const { enabled: enabledOption, ...restOptions } = options ?? {};
	const enabled = !!term && (enabledOption ?? true);

	return GET('/search/:provider/:term', {
		apiId: `search:${provider}`,
		enabled,
		...(term && {
			urlParameters: { provider, term },
			cacheId: ({ urlParameters }) => `search:${urlParameters.provider}:${urlParameters.term}`,
		}),
		...restOptions,
	});
};
