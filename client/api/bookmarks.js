import { GET, POST, PATCH, DELETE } from './util';

export const getBookmarks = async options => await GET('/bookmarks', { id: 'bookmarks', ...options });

export const getBookmark = async (id, options) => await GET(`/bookmarks/${id}`, { id: ['bookmarks', id], ...options });

export const createBookmark = async options => await POST(`/bookmarks`, { invalidates: ['bookmarks', 'categories'], ...options });

export const updateBookmark = async (id, options) => await PATCH(`/bookmarks/${id}`, { invalidates: ['bookmarks', 'categories'], ...options });

export const deleteBookmark = async (id, options) => await DELETE(`/bookmarks/${id}`, { invalidates: ['bookmarks'], ...options });
