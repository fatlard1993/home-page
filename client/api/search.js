import { GET } from './util';

export const getSearchResults = async (term, options) => await GET(`/search/${encodeURIComponent(term)}`, options);
