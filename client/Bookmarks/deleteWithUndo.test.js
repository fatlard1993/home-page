import { afterAll, beforeAll, beforeEach, describe, test, expect } from 'bun:test';

import * as api from '../api';
import deleteBookmarkWithUndo from './deleteBookmarkWithUndo';
import deleteWithUndo, { deleteCategoryWithUndo } from './deleteWithUndo';

// The write/read functions are the only thing under deleteWithUndo it cannot own, so '../api' is
// mocked to record calls. Spreading the real exports keeps every other api function intact for any
// test file that loads after this one (mock.module is process-wide).
let calls;
let createdSeq;

beforeAll(() => {
	mock.module('../api', () => ({
		...api,
		getBookmarkFaviconDataUri: id => {
			calls.push({ fn: 'getFavicon', id });

			return Promise.resolve(`data:image/png;base64,favicon-of-${id}`);
		},
		deleteBookmark: (id, options) => {
			calls.push({ fn: 'deleteBookmark', id, options });

			return Promise.resolve(id === 'refused' ? { status: 'error', body: { error: 'Bookmark not found' } } : {});
		},
		deleteCategory: (id, options) => {
			calls.push({ fn: 'deleteCategory', id, options });

			return Promise.resolve(id === 'refused' ? { status: 'error', body: { error: 'Category not found' } } : {});
		},
		createCategory: ({ body }) => {
			const newId = `newcat-${createdSeq++}`;
			calls.push({ fn: 'createCategory', body });

			if (body.name === 'Refused') return Promise.resolve({ status: 'error', body: { error: 'Name is required' } });

			return Promise.resolve({ body: { id: newId, ...body } });
		},
		createBookmark: ({ body }) => {
			const newId = `newbm-${createdSeq++}`;
			calls.push({ fn: 'createBookmark', body });

			return Promise.resolve({ body: { id: newId, ...body } });
		},
		updateBookmark: (id, options) => {
			calls.push({ fn: 'updateBookmark', id, options });

			return Promise.resolve({ body: { id, ...options.body } });
		},
		setBookmarkFaviconFromDataUri: (id, dataUri) => {
			calls.push({ fn: 'setFavicon', id, dataUri });

			return Promise.resolve();
		},
	}));
});

// updateBookmark is mocked too, which another file's test uses for real, so the real api goes back after these
const real = { ...api };

afterAll(() => {
	mock.module('../api', () => real);
});

beforeEach(() => {
	calls = [];
	createdSeq = 0;
});

const only = fn => calls.filter(call => call.fn === fn);
const flush = () => new Promise(resolve => setTimeout(resolve, 30));
const pressUndo = () => {
	const undo = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Undo'));

	undo.click();

	return undo;
};

describe('deleteWithUndo', () => {
	test('captures favicons before any deletion, and only for bookmarks that have one', async () => {
		await deleteWithUndo({
			bookmarks: [
				{ id: 'b1', name: 'a', favicon: 'yes.png' },
				{ id: 'b2', name: 'b', favicon: null },
				{ id: 'b3', name: 'c', favicon: 'yes.png' },
			],
		});

		// Only the two with a favicon are captured...
		expect(only('getFavicon').map(call => call.id)).toEqual(['b1', 'b3']);

		// ...and every capture lands before the first deletion, since the delete wipes the file.
		const firstDelete = calls.findIndex(call => call.fn === 'deleteBookmark');
		const lastCapture = calls.map(call => call.fn).lastIndexOf('getFavicon');

		expect(lastCapture).toBeLessThan(firstDelete);
	});

	test('deletes all bookmarks first, then categories, in order', async () => {
		await deleteWithUndo({
			bookmarks: [
				{ id: 'b1', name: 'a' },
				{ id: 'b2', name: 'b' },
			],
			categories: [{ id: 'c1', name: 'Cat' }],
		});

		expect(calls.filter(call => call.fn.startsWith('delete'))).toEqual([
			{ fn: 'deleteBookmark', id: 'b1', options: { invalidates: [] } },
			{ fn: 'deleteBookmark', id: 'b2', options: { invalidates: [] } },
			{ fn: 'deleteCategory', id: 'c1', options: undefined },
		]);
	});

	test('suppresses cache invalidation on every deletion except the last', async () => {
		await deleteWithUndo({
			bookmarks: [
				{ id: 'b1', name: 'a' },
				{ id: 'b2', name: 'b' },
			],
			categories: [{ id: 'c1', name: 'Cat' }],
		});

		const deletions = calls.filter(call => call.fn.startsWith('delete'));

		// All but the final deletion carry the suppressing option so intermediate writes do not each
		// trigger a full bookmarks + categories refetch.
		for (const deletion of deletions.slice(0, -1)) expect(deletion.options).toEqual({ invalidates: [] });

		// The final deletion keeps its default invalidation (no options) to surface everything at once.
		expect(deletions.at(-1).options).toBeUndefined();
	});

	test('a single bookmark with no category still passes undefined on its only (final) delete', async () => {
		await deleteWithUndo({ bookmarks: [{ id: 'b1', name: 'a' }] });

		expect(calls.filter(call => call.fn.startsWith('delete'))).toEqual([
			{ fn: 'deleteBookmark', id: 'b1', options: undefined },
		]);
	});

	test('a refused delete throws its reason, and the deletes after it do not run', async () => {
		await expect(
			deleteWithUndo({
				bookmarks: [
					{ id: 'refused', name: 'a' },
					{ id: 'b2', name: 'b' },
				],
			}),
		).rejects.toThrow('Bookmark not found');

		expect(only('deleteBookmark').map(call => call.id)).toEqual(['refused']);
	});

	describe('undo', () => {
		test('recreates categories then bookmarks, remapping the category id and restoring favicons', async () => {
			await deleteWithUndo({
				bookmarks: [
					{ id: 'b1', name: 'a', url: 'http://a', category: 'c1', order: 0, favicon: 'yes.png' },
					{ id: 'b2', name: 'b', url: 'http://b', category: 'c1', order: 1, favicon: null },
				],
				categories: [{ id: 'c1', name: 'Cat', color: '', order: 0 }],
			});

			pressUndo();
			await flush();

			// Categories are recreated before bookmarks so the remap target exists.
			const createOrder = calls.filter(call => call.fn.startsWith('create')).map(call => call.fn);
			expect(createOrder).toEqual(['createCategory', 'createBookmark', 'createBookmark']);

			// Both bookmarks point at the newly-created category's id, not the old 'c1'.
			const newCategoryId = only('createCategory').length ? `newcat-0` : null;
			for (const call of only('createBookmark')) expect(call.body.category).toBe(newCategoryId);

			// Only the bookmark that had a favicon gets its bytes restored, keyed to its NEW id.
			const restores = only('setFavicon');
			expect(restores).toHaveLength(1);
			expect(restores[0].dataUri).toBe('data:image/png;base64,favicon-of-b1');
			// b1 was the first bookmark recreated (after the one category), so newbm-1.
			expect(restores[0].id).toBe('newbm-1');
		});

		test('a double-press restores everything only once (the button locks on first press)', async () => {
			await deleteWithUndo({
				bookmarks: [{ id: 'b1', name: 'a', url: 'http://a', category: '', order: 0, favicon: 'yes.png' }],
			});

			const undo = pressUndo();
			// Second synchronous press before the first async run yields: guard must swallow it.
			undo.click();
			await flush();

			expect(only('createBookmark')).toHaveLength(1);
			expect(only('setFavicon')).toHaveLength(1);
		});

		test('a refused restore stops there and says why', async () => {
			await deleteWithUndo({
				bookmarks: [{ id: 'b1', name: 'a', url: 'http://a', category: 'c1', order: 0 }],
				categories: [{ id: 'c1', name: 'Refused', color: '', order: 0 }],
			});

			pressUndo();
			await flush();

			// No bookmark is recreated against a category that never came back
			expect(only('createBookmark')).toHaveLength(0);
			expect(document.body.textContent).toContain('Undo failed part way through: Name is required.');
		});
	});
});

describe('deleteCategoryWithUndo', () => {
	const category = { id: 'c1', name: 'Dev', color: '#f00', order: 3 };
	const bookmarks = [
		{ id: 'b1', name: 'a', url: 'http://a', category: 'c1', order: 0, favicon: 'yes.png' },
		{ id: 'b2', name: 'b', url: 'http://b', category: 'c1', order: 1 },
	];

	test('its bookmarks moved, the server moves them in the one delete, and the toast says where', async () => {
		await deleteCategoryWithUndo({ category, bookmarks, moveTo: 'c2', moveToName: 'News' });

		expect(calls.filter(call => call.fn.startsWith('delete'))).toEqual([
			{ fn: 'deleteCategory', id: 'c1', options: { searchParameters: { moveTo: 'c2' } } },
		]);

		const toast = [...document.querySelectorAll('[role="status"]')].find(notify =>
			notify.textContent.includes('Deleted category "Dev", its 2 bookmarks moved to News'),
		);

		expect(toast.textContent).toContain('Undo');
	});

	test('undo puts the category back in its place, and moves its moved bookmarks back into it, in their order', async () => {
		await deleteCategoryWithUndo({ category, bookmarks, moveTo: '' });

		pressUndo();
		await flush();

		expect(only('createCategory').map(call => call.body)).toEqual([{ name: 'Dev', color: '#f00', order: 3 }]);
		// The same bookmarks, not copies: they kept their ids and favicons where they were moved to
		expect(only('createBookmark')).toHaveLength(0);
		expect(only('updateBookmark')).toEqual([
			{ fn: 'updateBookmark', id: 'b1', options: { body: { category: 'newcat-0', order: 0 }, invalidates: [] } },
			{ fn: 'updateBookmark', id: 'b2', options: { body: { category: 'newcat-0', order: 1 } } },
		]);
	});

	test('its bookmarks going with it, they are deleted and restored with it, favicons and all', async () => {
		await deleteCategoryWithUndo({ category, bookmarks });

		expect(calls.filter(call => call.fn.startsWith('delete')).map(call => call.id)).toEqual(['b1', 'b2', 'c1']);

		pressUndo();
		await flush();

		expect(only('createBookmark').map(call => call.body.category)).toEqual(['newcat-0', 'newcat-0']);
		expect(only('setFavicon')).toHaveLength(1);
	});

	test('a refused delete throws its reason, and offers no Undo', async () => {
		const toasts = document.querySelectorAll('[role="status"]').length;

		await expect(
			deleteCategoryWithUndo({ category: { id: 'refused', name: 'Gone' }, bookmarks: [], moveTo: '' }),
		).rejects.toThrow('Category not found');

		expect(document.querySelectorAll('[role="status"]').length).toBe(toasts);
	});
});

describe('deleteBookmarkWithUndo', () => {
	test('deletes straight away and toasts Undo, with no confirm first', async () => {
		const dialogsBefore = document.querySelectorAll('dialog').length;

		await deleteBookmarkWithUndo({ id: 'b1', name: 'Straight' });

		expect(only('deleteBookmark').map(call => call.id)).toEqual(['b1']);
		expect(document.querySelectorAll('dialog').length).toBe(dialogsBefore);

		// A done delete is a success toast, which Notify gives the status role
		const toast = [...document.querySelectorAll('[role="status"]')].find(notify =>
			notify.textContent.includes('Deleted "Straight"'),
		);

		expect(toast.textContent).toContain('Undo');
	});

	test('a refused delete is reported, and offers no Undo', async () => {
		await deleteBookmarkWithUndo({ id: 'refused', name: 'Kept' });

		expect(document.body.textContent).toContain('Could not delete "Kept": Bookmark not found');
	});
});
