import { GET, POST, PATCH, DELETE } from '@vanilla-bean/hypertether';

export const getBookmarks = async options =>
	await GET('/bookmarks', { apiId: 'bookmarks', invalidateAfter: false, ...options });

export const getBookmark = async (id, options) =>
	await GET('/bookmarks/:id', { apiId: ['bookmarks', id], urlParameters: { id }, ...options });

export const createBookmark = async options =>
	await POST('/bookmarks', { invalidates: ['bookmarks', 'categories'], ...options });

export const updateBookmark = async (id, options) =>
	await PATCH('/bookmarks/:id', { invalidates: ['bookmarks', 'categories'], urlParameters: { id }, ...options });

export const deleteBookmark = async (id, options) =>
	await DELETE('/bookmarks/:id', { invalidates: ['bookmarks', 'categories'], urlParameters: { id }, ...options });
