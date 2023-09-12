import { GET } from './util';

export const getSearchResults = async (term, options) => await GET(`/search/${term}`, options);
