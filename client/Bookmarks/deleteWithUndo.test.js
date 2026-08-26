import { beforeAll, beforeEach, describe, test, expect } from 'bun:test';

import * as api from '../api';
import deleteWithUndo from './deleteWithUndo';

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

			return Promise.resolve();
		},
		deleteCategory: (id, options) => {
			calls.push({ fn: 'deleteCategory', id, options });

			return Promise.resolve();
		},
		createCategory: ({ body }) => {
			const newId = `newcat-${createdSeq++}`;
			calls.push({ fn: 'createCategory', body });

			return Promise.resolve({ body: { id: newId, ...body } });
		},
		createBookmark: ({ body }) => {
			const newId = `newbm-${createdSeq++}`;
			calls.push({ fn: 'createBookmark', body });

			return Promise.resolve({ body: { id: newId, ...body } });
		},
		setBookmarkFaviconFromDataUri: (id, dataUri) => {
			calls.push({ fn: 'setFavicon', id, dataUri });

			return Promise.resolve();
		},
	}));
});

beforeEach(() => {
	calls = [];
	createdSeq = 0;
});

const only = fn => calls.filter(call => call.fn === fn);
const flush = () => new Promise(resolve => setTimeout(resolve, 30));
const pressUndo = () => {
	const undo = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Undo'));

	undo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

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
			undo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
			await flush();

			expect(only('createBookmark')).toHaveLength(1);
			expect(only('setFavicon')).toHaveLength(1);
		});
	});
});
