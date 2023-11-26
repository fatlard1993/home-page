import { GET, POST, PATCH, DELETE } from 'vanilla-bean-components';

export const getCategories = async options => await GET('/categories', { id: 'categories', ...options });

export const getCategory = async (id, options) => await GET(`/categories/${id}`, { id: ['categories', id], ...options });

export const createCategory = async options => await POST(`/categories`, { invalidates: ['categories'], ...options });

export const updateCategory = async (id, options) => await PATCH(`/categories/${id}`, { invalidates: ['categories'], ...options });

export const deleteCategory = async (id, options) => await DELETE(`/categories/${id}`, { invalidates: ['bookmarks', 'categories'], ...options });
