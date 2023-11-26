import { GET } from 'vanilla-bean-components';

export const getSearchResults = async (term, options) => await GET(`/search/${encodeURIComponent(term)}`, { enabled: !!term && (options?.enabled ?? true), ...options });
