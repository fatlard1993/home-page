import { afterAll, beforeAll, beforeEach, describe, test, expect } from 'bun:test';
import { findByRole } from '@testing-library/dom';

import * as api from '../api';
import Bookmarks from './Bookmarks';
import { batchFieldsChanged } from './util';

// Requires mocking all API calls (getBookmarks, getCategories, getSearchEngines) before unskipping
describe.skip('Bookmarks', () => {
	test('must render', async () => {
		new Bookmarks({ appendTo: container });

		await findByRole(container, 'search');
	});
});

// Exercised against the prototype: _buildBatchState only reads the two subscription bodies, so it
// needs none of the component's DOM. What's under test is the pairing of the state it builds with
// the `stored` snapshot the commit diffs against — the two have to agree, or Done writes the board.
const buildBatchState = (categories, bookmarks) =>
	Bookmarks.prototype._buildBatchState.call({ categories: { body: categories }, bookmarks: { body: bookmarks } });

const changedIds = batch => [
	...Object.values(batch.bookmarks)
		.filter(bookmark => batchFieldsChanged(bookmark, batch.stored.bookmarks[bookmark.id]))
		.map(bookmark => bookmark.id),
	...Object.values(batch.categories)
		.filter(category => batchFieldsChanged(category, batch.stored.categories[category.id]))
		.map(category => category.id),
];

describe('batch edit commit set', () => {
	const categories = { cat1: { id: 'cat1', name: 'One', order: 0 }, cat2: { id: 'cat2', name: 'Two', order: 1 } };
	const bookmarks = {
		b1: { id: 'b1', name: 'a', category: 'cat1', order: 0 },
		b2: { id: 'b2', name: 'b', category: 'cat1', order: 1 },
		b3: { id: 'b3', name: 'c', category: 'cat2', order: 0 },
		b4: { id: 'b4', name: 'd', category: '', order: 0 },
	};

	test('an untouched batch has nothing to write', () => {
		expect(changedIds(buildBatchState(categories, bookmarks))).toEqual([]);
	});

	test('moving one bookmark writes only what shifted', () => {
		const batch = buildBatchState(categories, bookmarks);

		batch.bookmarks.b3.category = 'cat1';
		batch.bookmarks.b3.order = 2;

		expect(changedIds(batch)).toEqual(['b3']);
	});

	test('reordering within a category writes only the swapped pair', () => {
		const batch = buildBatchState(categories, bookmarks);

		batch.bookmarks.b1.order = 1;
		batch.bookmarks.b2.order = 0;

		expect(changedIds(batch).sort()).toEqual(['b1', 'b2']);
	});

	test('a sparse stored order is healed once, then stays clean', () => {
		const sparse = {
			b1: { id: 'b1', name: 'a', category: '', order: 0 },
			b2: { id: 'b2', name: 'b', category: '', order: 10 },
			b3: { id: 'b3', name: 'c', category: '', order: 20 },
		};

		expect(changedIds(buildBatchState({}, sparse))).toEqual(['b2', 'b3']);

		const healed = Object.fromEntries(
			Object.values(buildBatchState({}, sparse).bookmarks).map(({ deleted, ...bookmark }) => [bookmark.id, bookmark]),
		);

		expect(changedIds(buildBatchState({}, healed))).toEqual([]);
	});

	test('a bookmark in a since-deleted category is rewritten to no category', () => {
		const orphaned = { b1: { id: 'b1', name: 'a', category: 'gone', order: 0 } };
		const batch = buildBatchState({}, orphaned);

		expect(batch.bookmarks.b1.category).toBe('');
		expect(changedIds(batch)).toEqual(['b1']);
	});

	test('painting one bookmark writes only that bookmark', () => {
		const batch = buildBatchState(categories, bookmarks);

		batch.bookmarks.b2.color = 'hsl(120, 50%, 50%)';

		expect(changedIds(batch)).toEqual(['b2']);
	});

	test('painting a category writes the category, not its bookmarks', () => {
		const batch = buildBatchState(categories, bookmarks);

		batch.categories.cat1.color = 'hsl(120, 50%, 50%)';

		expect(changedIds(batch)).toEqual(['cat1']);
	});
});

// Built on the real prototype so the methods, and the batchMode/brushColor getters that read
// through to the bar, are the ones the app runs. Only the container rendering is stubbed, leaving
// which record takes the color — and whether the commit will notice — as what's under test.
describe('paint mode', () => {
	const paintHarness = ({ brushColor, mode = 'paint' } = {}) => {
		const harness = Object.assign(Object.create(Bookmarks.prototype), {
			batchEdit: true,
			batchDirty: false,
			batchBar: { options: { mode, brushColor } },
			_brushesUsed: new Set(),
			_batchContainers: { cat1: { options: {} } },
			refreshed: [],
			content: { elem: { querySelector: () => null } },
			_refreshMarkedCount: () => {},
		});

		harness._refreshBatchContainerBookmarks = key => harness.refreshed.push(key);
		harness.batch = harness._buildBatchState.call({
			categories: { body: { cat1: { id: 'cat1', name: 'One', order: 0, color: 'hsl(1, 1%, 1%)' } } },
			bookmarks: {
				body: {
					b1: { id: 'b1', name: 'a', category: 'cat1', order: 0 },
					b2: { id: 'b2', name: 'b', category: 'cat1', order: 1, color: 'hsl(9, 9%, 9%)' },
				},
			},
		});

		return harness;
	};

	test('a tap in paint mode colors the bookmark and marks the batch dirty', () => {
		const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)' });

		harness.tapBookmark('b1');

		expect(harness.batch.bookmarks.b1.color).toBe('hsl(120, 50%, 50%)');
		expect(harness.batch.bookmarks.b1.deleted).toBe(false);
		expect(harness.batchDirty).toBe(true);
		expect(harness.refreshed).toEqual(['cat1']);
	});

	test('a tap in delete mode still marks for deletion instead of painting', () => {
		const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)', mode: 'delete' });

		harness.tapBookmark('b1');

		expect(harness.batch.bookmarks.b1.deleted).toBe(true);
		expect(harness.batch.bookmarks.b1.color).toBeUndefined();
	});

	test('an erase brush clears a bookmark’s own color', () => {
		const harness = paintHarness({ brushColor: '' });

		harness.tapBookmark('b2');

		expect(harness.batch.bookmarks.b2.color).toBe('');
		expect(harness.batchDirty).toBe(true);
	});

	test('painting a bookmark the color it already has changes nothing', () => {
		const harness = paintHarness({ brushColor: 'hsl(9, 9%, 9%)' });

		harness.tapBookmark('b2');

		expect(harness.batchDirty).toBe(false);
		expect(harness.refreshed).toEqual([]);
	});

	test('a random brush gives each painted bookmark its own color', () => {
		const harness = paintHarness({ brushColor: 'random' });

		harness.tapBookmark('b1');
		harness.tapBookmark('b2');

		const { b1, b2 } = harness.batch.bookmarks;

		expect(b1.color).toMatch(/^hsl\(/);
		expect(b2.color).toMatch(/^hsl\(/);
		expect(b1.color).not.toBe(b2.color);
	});

	test('painting a category recolors it and refreshes its bookmarks', () => {
		const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)' });

		harness.tapCategory('cat1');

		expect(harness.batch.categories.cat1.color).toBe('hsl(120, 50%, 50%)');
		expect(harness.batchDirty).toBe(true);
		expect(harness.refreshed).toEqual(['cat1']);
		expect(harness._batchContainers.cat1.options.style.borderLeft).toContain('solid');
	});

	test('an uncolored bookmark displays its category’s color, a colored one keeps its own', () => {
		const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)' });

		harness.paintCategory('cat1');

		const [b1, b2] = harness._batchBookmarksFor('cat1');

		expect(b1.color).toBe('hsl(120, 50%, 50%)');
		expect(b2.color).toBe('hsl(9, 9%, 9%)');
		// Display-only: the record itself stays colorless so it keeps following the category.
		expect(harness.batch.bookmarks.b1.color).toBeUndefined();
	});

	test('erasing a category drops its border rather than leaving the old one', () => {
		const harness = paintHarness({ brushColor: '' });

		harness.tapCategory('cat1');

		expect(harness.batch.categories.cat1.color).toBe('');
		expect(harness._batchContainers.cat1.options.style).toEqual({ width: '', borderLeft: '' });
	});

	describe('remembering brush colors', () => {
		beforeEach(() => localStorage.clear());

		test('a used brush joins the recent colors on commit', () => {
			const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)' });

			harness.tapBookmark('b1');
			harness._rememberBrushColors();

			expect(JSON.parse(localStorage.getItem('recentColors'))).toEqual(['hsl(120, 50%, 50%)']);
		});

		test('a brush that was never used is not remembered', () => {
			const harness = paintHarness({ brushColor: 'hsl(120, 50%, 50%)' });

			harness._rememberBrushColors();

			expect(localStorage.getItem('recentColors')).toBeNull();
		});

		test('a brush that changed nothing is not remembered', () => {
			const harness = paintHarness({ brushColor: 'hsl(9, 9%, 9%)' });

			// b2 already wears exactly this color, so the tap is a no-op.
			harness.tapBookmark('b2');
			harness._rememberBrushColors();

			expect(localStorage.getItem('recentColors')).toBeNull();
		});

		test('erase and random are not colors worth remembering', () => {
			const eraser = paintHarness({ brushColor: '' });
			const randomizer = paintHarness({ brushColor: 'random' });

			eraser.tapBookmark('b2');
			randomizer.tapBookmark('b1');
			randomizer.tapBookmark('b2');

			eraser._rememberBrushColors();
			randomizer._rememberBrushColors();

			// Ten slots is not many — per-click randoms would flush every deliberate choice out.
			expect(localStorage.getItem('recentColors')).toBeNull();
		});
	});
});

// The real commitBatchEdit run against the prototype: the write functions are the only thing under
// the method it cannot own, so '../api' is mocked to record calls and, per test, to fail one.
// _exitBatchEdit is stubbed to a flag so success/failure is read off whether the board tore down.
describe('commit', () => {
	let writes;
	let writeBehavior;
	let deleteWithUndoArgs;
	let confirmDeleteResult;

	const makeSub = () => ({
		invalidated: 0,
		refetched: 0,
		invalidateCache() {
			this.invalidated++;
		},
		refetch() {
			this.refetched++;

			return Promise.resolve();
		},
	});

	const commitHarness = ({ dirty = true } = {}) => {
		const harness = Object.assign(Object.create(Bookmarks.prototype), {
			batchDirty: dirty,
			_brushesUsed: new Set(),
			batchBar: { options: {} },
			bookmarks: makeSub(),
			categories: makeSub(),
			exited: false,
		});

		harness._exitBatchEdit = () => {
			harness.exited = true;
		};

		harness.batch = harness._buildBatchState.call({
			categories: { body: { cat1: { id: 'cat1', name: 'One', order: 0 } } },
			bookmarks: {
				body: {
					b1: { id: 'b1', name: 'a', category: 'cat1', order: 0 },
					b2: { id: 'b2', name: 'b', category: 'cat1', order: 1 },
				},
			},
		});

		return harness;
	};

	beforeAll(() => {
		// mock.module replaces the whole module process-wide; spreading the real exports keeps
		// every other api function intact for any test file that loads after this one.
		mock.module('../api', () => ({
			...api,
			updateBookmark: (id, options) => {
				writes.push({ kind: 'bookmark', id, options });

				return writeBehavior();
			},
			updateCategory: (id, options) => {
				writes.push({ kind: 'category', id, options });

				return writeBehavior();
			},
		}));
	});

	// The delete branch hands off to confirmBatchDelete (auto-confirmed here) and deleteWithUndo,
	// both stubbed so the branch that suppresses invalidation on the surviving writes — relying on
	// the final delete to surface them — is what's exercised, not the real dialog or delete flow.
	// mock.module is process-wide, so the real implementations are captured first and restored in
	// afterAll — otherwise these stubs would leak into confirmDialog.test.js / deleteWithUndo.test.js.
	let realConfirmBatchDelete;
	let realDeleteWithUndo;

	beforeAll(async () => {
		realConfirmBatchDelete = (await import('./confirmBatchDelete')).default;
		realDeleteWithUndo = (await import('./deleteWithUndo')).default;

		mock.module('./confirmBatchDelete', () => ({ default: () => Promise.resolve(confirmDeleteResult) }));
		mock.module('./deleteWithUndo', () => ({
			default: async args => {
				deleteWithUndoArgs = args;
			},
		}));
	});

	afterAll(() => {
		mock.module('./confirmBatchDelete', () => ({ default: realConfirmBatchDelete }));
		mock.module('./deleteWithUndo', () => ({ default: realDeleteWithUndo }));
	});

	beforeEach(() => {
		writes = [];
		writeBehavior = () => Promise.resolve();
		deleteWithUndoArgs = undefined;
		confirmDeleteResult = true;
	});

	test('a clean batch exits without writing anything', async () => {
		const harness = commitHarness({ dirty: false });

		await harness.commitBatchEdit();

		expect(writes).toEqual([]);
		expect(harness.exited).toBe(true);
	});

	test('only the changed records are written, with invalidation suppressed', async () => {
		const harness = commitHarness();

		harness.batch.bookmarks.b1.order = 5;

		await harness.commitBatchEdit();

		expect(writes.map(write => write.id)).toEqual(['b1']);
		expect(writes[0].options.invalidates).toEqual([]);
	});

	test('a successful commit refetches once and tears the board down', async () => {
		const harness = commitHarness();

		harness.batch.bookmarks.b1.order = 5;

		await harness.commitBatchEdit();

		expect(harness.bookmarks.invalidated).toBe(1);
		expect(harness.bookmarks.refetched).toBe(1);
		expect(harness.exited).toBe(true);
		expect(harness.batchBar.options.saving).toBe(false);
	});

	test('a failed write refreshes the caches, leaves the board open, and clears saving', async () => {
		writeBehavior = () => Promise.reject(new Error('network'));

		const harness = commitHarness();

		harness.batch.bookmarks.b1.order = 5;

		await harness.commitBatchEdit();

		// A write may have landed with invalidation suppressed, so both caches are refreshed to
		// replace the optimistic board with server truth even though the commit failed.
		expect(harness.bookmarks.invalidated).toBe(1);
		expect(harness.bookmarks.refetched).toBe(1);
		expect(harness.categories.invalidated).toBe(1);
		// Batch mode stays up so the user can retry; the re-commit re-diffs the same snapshot.
		expect(harness.exited).toBe(false);
		expect(harness.batchBar.options.saving).toBe(false);
		expect(harness._batchCommitting).toBe(false);
	});

	test('a second Done press during a pending commit does nothing', async () => {
		let releaseWrite;

		writeBehavior = () => new Promise(resolve => (releaseWrite = resolve));

		const harness = commitHarness();

		harness.batch.bookmarks.b1.order = 5;

		const first = harness.commitBatchEdit();
		const second = harness.commitBatchEdit();

		releaseWrite();
		await Promise.all([first, second]);

		expect(writes.map(write => write.id)).toEqual(['b1']);
	});

	test('a marked bookmark is handed to deleteWithUndo while surviving writes suppress invalidation', async () => {
		const harness = commitHarness();

		// b2 is doomed; b1 survives but shifts, so it must still be written — with invalidation
		// suppressed, since the trailing deleteWithUndo is what surfaces the batch to the caches.
		harness.batch.bookmarks.b2.deleted = true;
		harness.batch.bookmarks.b1.order = 5;

		await harness.commitBatchEdit();

		// The delete path ran against the doomed record, not the survivor.
		expect(deleteWithUndoArgs.bookmarks.map(bookmark => bookmark.id)).toEqual(['b2']);
		expect(deleteWithUndoArgs.categories).toEqual([]);

		// The surviving update landed with invalidation suppressed.
		expect(writes.map(write => write.id)).toEqual(['b1']);
		expect(writes[0].options.invalidates).toEqual([]);

		// The delete branch owns cache refresh, so commit does not fire its own invalidate/refetch.
		expect(harness.bookmarks.invalidated).toBe(0);
		expect(harness.bookmarks.refetched).toBe(0);
		expect(harness.exited).toBe(true);
	});

	test('declining the delete confirm aborts the commit before any write', async () => {
		confirmDeleteResult = false;

		const harness = commitHarness();

		harness.batch.bookmarks.b2.deleted = true;
		harness.batch.bookmarks.b1.order = 5;

		await harness.commitBatchEdit();

		expect(writes).toEqual([]);
		expect(deleteWithUndoArgs).toBeUndefined();
		expect(harness.exited).toBe(false);
	});

	test('Escape during a save is ignored instead of tearing down the board mid-commit', async () => {
		let releaseWrite;

		writeBehavior = () => new Promise(resolve => (releaseWrite = resolve));

		const cleanups = {};
		const harness = commitHarness();

		harness.batchEdit = true;
		harness.batch.bookmarks.b1.order = 5;
		harness.cancelled = 0;
		harness.cancelBatchEdit = () => harness.cancelled++;
		harness.addCleanup = (name, remove) => (cleanups[name] = remove);
		harness._setupBatchGuards();

		const commit = harness.commitBatchEdit();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(harness.cancelled).toBe(0);

		releaseWrite();
		await commit;

		expect(harness.exited).toBe(true);

		Object.values(cleanups).forEach(remove => remove());
	});
});

describe('leaving batch edit', () => {
	let discardChoice;
	let discardCalls;
	let discardImpl;
	let realConfirmDiscardBatch;

	beforeAll(async () => {
		// Captured and restored (afterAll) so this stub does not leak process-wide into
		// confirmDialog.test.js, which exercises the real confirmDiscardBatch.
		realConfirmDiscardBatch = (await import('./confirmDiscardBatch')).default;

		mock.module('./confirmDiscardBatch', () => ({
			default: () => {
				discardCalls++;

				return discardImpl();
			},
		}));
	});

	afterAll(() => {
		mock.module('./confirmDiscardBatch', () => ({ default: realConfirmDiscardBatch }));
	});

	beforeEach(() => {
		discardCalls = 0;
		discardImpl = () => Promise.resolve(discardChoice);
	});

	const exitHarness = dirty => {
		const harness = Object.assign(Object.create(Bookmarks.prototype), {
			batchEdit: true,
			batchDirty: dirty,
			exited: false,
		});

		harness._exitBatchEdit = () => {
			harness.exited = true;
		};

		return harness;
	};

	test('a clean cancel exits without asking', async () => {
		const harness = exitHarness(false);

		await harness.cancelBatchEdit();

		expect(harness.exited).toBe(true);
	});

	test('a dirty cancel stays open when the discard is declined', async () => {
		discardChoice = false;

		const harness = exitHarness(true);

		await harness.cancelBatchEdit();

		expect(harness.exited).toBe(false);
	});

	test('a dirty cancel exits when the discard is confirmed', async () => {
		discardChoice = true;

		const harness = exitHarness(true);

		await harness.cancelBatchEdit();

		expect(harness.exited).toBe(true);
	});

	test('a second cancel while the discard confirm is pending is ignored', async () => {
		let resolveAsk;

		discardImpl = () => new Promise(resolve => (resolveAsk = resolve));

		const harness = exitHarness(true);

		const first = harness.cancelBatchEdit();
		const second = harness.cancelBatchEdit();

		expect(discardCalls).toBe(1);

		resolveAsk(false);
		await Promise.all([first, second]);

		expect(harness.exited).toBe(false);
	});

	test('the loaded brush survives leaving batch edit', () => {
		const harness = Object.assign(Object.create(Bookmarks.prototype), {
			batchEdit: true,
			batchBar: { options: { brushColor: 'hsl(200, 50%, 50%)' }, elem: { style: {} } },
			renderContent: () => {},
		});

		harness._exitBatchEdit();

		expect(harness.batchBar.options.brushColor).toBe('hsl(200, 50%, 50%)');
	});

	test('Escape cancels while in batch edit, and is inert outside it', () => {
		const cleanups = {};

		const harness = Object.assign(Object.create(Bookmarks.prototype), { batchEdit: true, cancelled: 0 });

		harness.cancelBatchEdit = () => {
			harness.cancelled++;
		};
		harness.addCleanup = (name, remove) => {
			cleanups[name] = remove;
		};

		harness._setupBatchGuards();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(harness.cancelled).toBe(1);

		harness.batchEdit = false;
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(harness.cancelled).toBe(1);

		Object.values(cleanups).forEach(remove => remove());
	});

	test('leaving the page with a dirty board is blocked, with a clean one it is not', () => {
		const cleanups = {};

		const harness = Object.assign(Object.create(Bookmarks.prototype), { batchEdit: true, batchDirty: true });

		harness.addCleanup = (name, remove) => {
			cleanups[name] = remove;
		};

		harness._setupBatchGuards();

		const dirtyUnload = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(dirtyUnload);
		expect(dirtyUnload.defaultPrevented).toBe(true);

		harness.batchDirty = false;

		const cleanUnload = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(cleanUnload);
		expect(cleanUnload.defaultPrevented).toBe(false);

		Object.values(cleanups).forEach(remove => remove());
	});
});
