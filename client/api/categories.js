import { GET, POST, PUT, DELETE } from './util';

export const getCategories = async options => await GET('/bookmarks/categories', options);

export const getCategory = async (id, options) => await GET(`/bookmarks/categories/${id}`, options);

export const createCategory = async options => await POST(`/bookmarks/categories`, options);

export const updateCategory = async (id, options) => await PUT(`/bookmarks/categories/${id}`, options);

export const deleteCategory = async (id, options) => await DELETE(`/bookmarks/categories/${id}`, options);
