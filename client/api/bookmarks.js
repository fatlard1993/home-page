import { resource } from '@vanilla-bean/hypertether';

const bookmarks = resource('/bookmarks', { invalidates: ['bookmarks', 'categories'] });

export const getBookmarks = bookmarks.list;

export const getBookmark = bookmarks.read;

export const createBookmark = bookmarks.create;

export const updateBookmark = bookmarks.update;

export const deleteBookmark = bookmarks.delete;
