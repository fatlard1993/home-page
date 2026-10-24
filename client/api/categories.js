import { resource } from '@vanilla-bean/components';

const categories = resource('/categories');

export const getCategories = categories.list;

export const createCategory = categories.create;

export const updateCategory = categories.update;

export const deleteCategory = (id, options) =>
	categories.delete(id, { invalidates: ['bookmarks', 'categories'], ...options });
