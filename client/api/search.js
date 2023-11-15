import { GET } from './util';

export const getSearchResults = async (term, options) => await GET(`/search/${encodeURIComponent(term)}`, { enabled: !!term && (options?.enabled ?? true), ...options });
