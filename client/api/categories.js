import { GET, POST, PUT, DELETE } from './util';

export const getCategories = async options => await GET('/categories', { id: 'categories', ...options });

export const getCategory = async (id, options) => await GET(`/categories/${id}`, { id: ['categories', id], ...options });

export const createCategory = async options => await POST(`/categories`, { invalidates: ['categories'], ...options });

export const updateCategory = async (id, options) => await PUT(`/categories/${id}`, { invalidates: ['categories'], ...options });

export const deleteCategory = async (id, options) => await DELETE(`/categories/${id}`, { invalidates: ['bookmarks', 'categories'], ...options });
