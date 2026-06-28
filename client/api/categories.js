import { GET, POST, PATCH, DELETE } from '@vanilla-bean/hypertether';

export const getCategories = async options => await GET('/categories', { apiId: 'categories', ...options });

export const getCategory = async (id, options) =>
	await GET('/categories/:id', { apiId: ['categories', id], urlParameters: { id }, ...options });

export const createCategory = async options => await POST('/categories', { invalidates: ['categories'], ...options });

export const updateCategory = async (id, options) =>
	await PATCH('/categories/:id', { invalidates: ['categories'], urlParameters: { id }, ...options });

export const deleteCategory = async (id, options) =>
	await DELETE('/categories/:id', { invalidates: ['bookmarks', 'categories'], urlParameters: { id }, ...options });
