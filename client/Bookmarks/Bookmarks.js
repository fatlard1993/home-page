import uFuzzy from '@leeoniya/ufuzzy';
import { View, Elem, copyToClipboard, Icon, conditionalList } from '@vanilla-bean/components';
import { TinyColor } from '@ctrl/tinycolor';

import { orderBy } from '@vanilla-bean/components';

import { getBookmarks, getCategories, getSearchEngines, getSearchResult, updateBookmark, updateCategory } from '../api';

import { Content } from '../Layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';
import BatchEditBar from './BatchEditBar';
import SearchEngineButtons from './SearchEngineButtons';
import ContextMenu from './ContextMenu';
import confirmDeleteBookmark from './confirmDeleteBookmark';
import confirmBatchDelete from './confirmBatchDelete';
import deleteWithUndo from './deleteWithUndo';

import { fixLink, sortedIds } from './util';
import DeleteCategoryDialog from './DeleteCategoryDialog';

// Tolerant fuzzy: allows insertions, substitutions, transpositions, and deletions within matches
const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 5, intraSub: 1, intraTrn: 1, intraDel: 1 });

export default class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: event => this.showContextMenu(event),
			...options,
		});
	}

	async render() {
		this.toolbar = new BookmarksToolbar({
			appendTo: this.elem,
			search: term => {
				if (this.options.search === term) return;

				this.options.search = term;
			},
		});
		this.batchBar = new BatchEditBar({
			appendTo: this.elem,
			style: { display: 'none' },
			done: () => this.commitBatchEdit(),
			cancel: () => this.cancelBatchEdit(),
		});
		this.content = new Content({ appendTo: this.elem });
		this.contextMenu = new ContextMenu({ appendTo: this });

		this._setupBatchDnd();

		this.renderLoader();

		this._subscriptions = [];
		this.activatedEngines = new Set();

		this.categories = await this._subscribe(
			getCategories({
				onFetching: () => {
					this._categoriesFetching = true;
				},
				onSuccess: response => {
					this.categories = response;
					this._categoriesFetching = false;

					this._scheduleRenderContent();
				},
				onError: () => {
					this._categoriesFetching = false;
				},
			}),
		);

		this.bookmarks = await this._subscribe(
			getBookmarks({
				onFetching: () => {
					this._bookmarksFetching = true;
				},
				onSuccess: response => {
					this.bookmarks = response;
					this._bookmarksFetching = false;

					this._scheduleRenderContent();
				},
				onError: () => {
					this._bookmarksFetching = false;
				},
			}),
		);

		this.searchResults = {};

		this.engines = await this._subscribe(
			getSearchEngines({
				onSuccess: async response => {
					this.engines = response;

					this._unsubscribeSearchResults();
					await this.subscribeSearchResults();

					if (this.rendered) this.renderContent();
				},
			}),
		);

		await this.subscribeSearchResults();

		this.options.onDisconnected = () => this._unsubscribeAll();

		super.render();

		await this.renderContent();
	}

	async _subscribe(dataPromise) {
		const data = await dataPromise;

		this._subscriptions.push(data);

		return data;
	}

	// Bookmarks and categories are separate subscriptions that refetch independently, even
	// when a single action (e.g. deleting a category) invalidates both together. Rendering as
	// soon as just one lands can briefly categorize bookmarks against a stale (or momentarily
	// missing) category — wait until neither is mid-fetch so both updates land in one render.
	_scheduleRenderContent() {
		if (this._categoriesFetching || this._bookmarksFetching) return;
		if (this.rendered) this.renderContent();
	}

	_unsubscribeSearchResults() {
		for (const id of Object.keys(this.searchResults)) {
			this.searchResults[id]?.unsubscribe?.();

			const index = this._subscriptions.indexOf(this.searchResults[id]);
			if (index !== -1) this._subscriptions.splice(index, 1);
		}
	}

	_unsubscribeAll() {
		for (const sub of this._subscriptions) sub?.unsubscribe?.();
		this._subscriptions = [];
	}

	isEngineActive(engine) {
		return !!engine.default || this.activatedEngines.has(engine.id);
	}

	async subscribeSearchResults() {
		this.searchResults = {};

		for (const engine of Object.values(this.engines.body)) {
			this.searchResults[engine.id] = await this._subscribe(
				getSearchResult(engine.id, this.options.search, {
					enabled: !!this.options.search && this.isEngineActive(engine),
					onSuccess: response => {
						this.searchResults[engine.id] = response;

						if (this.rendered) this.renderContent();
					},
				}),
			);
		}
	}

	activateSearchEngine(engineId) {
		this.activatedEngines.add(engineId);

		this.searchResults[engineId]?.refetch({
			enabled: true,
			urlParameters: { provider: engineId, term: this.options.search },
		});

		this.renderContent();
	}

	static schema = {
		search: {
			set(value) {
				if (value) {
					this.renderLoader();

					for (const engine of Object.values(this.engines.body)) {
						this.searchResults[engine.id].refetch({
							enabled: this.isEngineActive(engine),
							urlParameters: { provider: engine.id, term: value },
						});
					}
				} else {
					this.activatedEngines.clear();

					if (this.rendered) this.renderContent();
				}
			},
		},
	};

	renderLoader() {
		this.content.empty();

		new Icon({
			appendTo: this.content,
			icon: 'spinner',
			animation: 'spin-pulse',
			styles: ({ colors }) => ({
				fontSize: '20vh',
				marginTop: '20%',
				display: 'flex',
				justifyContent: 'center',
				color: colors.blue,
			}),
		});
	}

	getFilteredBookmarkIds() {
		const bookmarkIds = Object.keys(this.bookmarks.body || {});

		if (!this.options.search) return bookmarkIds;

		const haystack = bookmarkIds.flatMap(id => [
			{ id, hay: this.bookmarks.body[id].name },
			{ id, hay: this.bookmarks.body[id].url },
		]);
		const matches = fuzzy.filter(
			haystack.map(({ hay }) => hay),
			this.options.search,
		);

		return [...new Set(matches?.map?.(i => haystack[i].id))];
	}

	getCategoryBookmarks(categoryId, filteredIds) {
		const matchingIds = filteredIds.filter(
			id =>
				this.bookmarks.body[id].category === categoryId ||
				// Uncategorized bucket: no categoryId and bookmark's category doesn't exist
				(!categoryId && !this.categories.body[this.bookmarks.body[id].category]),
		);

		if (this.options.search) return matchingIds.map(id => this.bookmarks.body[id]);

		const subset = Object.fromEntries(matchingIds.map(id => [id, this.bookmarks.body[id]]));

		return sortedIds(subset).map(id => this.bookmarks.body[id]);
	}

	renderBookmarksByCategory(filteredIds) {
		for (const categoryId of [undefined, ...sortedIds(this.categories.body)]) {
			const category = this.categories.body[categoryId] || { name: 'Bookmarks' };
			const categoryBookmarks = this.getCategoryBookmarks(categoryId, filteredIds);

			if (categoryBookmarks.length > 0) {
				new BookmarksContainer({
					appendTo: this.content,
					label: category.name,
					categoryId,
					// A bookmark without its own color inherits the category's, matching the picker's preview
					bookmarks: categoryBookmarks.map(bookmark => ({ ...bookmark, color: bookmark.color || category.color })),
					...(category.color && {
						style: {
							width: 'calc(100% - 28px)',
							borderLeft: `4px solid ${new TinyColor(category.color).setAlpha(0.4)}`,
						},
					}),
				});
			}
		}
	}

	renderSearchResults() {
		const inactiveEngines = [];

		for (const engine of Object.values(this.engines.body)) {
			if (!this.isEngineActive(engine)) {
				inactiveEngines.push(engine);

				continue;
			}

			const results = this.searchResults[engine.id]?.body;

			if (!results?.length) continue;

			const sorted = engine.orderBy ? [...results].sort(orderBy(engine.orderBy)) : results;

			new BookmarksContainer({
				appendTo: this.content,
				label: engine.label,
				bookmarks: sorted.map(item => ({
					name: item.name,
					url: item.url,
					onContextMenu: event =>
						this.showContextMenu({
							event,
							items: [
								{
									textContent: `Bookmark "${item.name}"`,
									onPointerPress: () => new BookmarkDialog({ bookmark: { name: item.name, url: fixLink(item.url) } }),
								},
							],
						}),
				})),
			});
		}

		if (inactiveEngines.length > 0) {
			new SearchEngineButtons({
				appendTo: this.content,
				label: 'More Search Results',
				engines: inactiveEngines,
				onActivate: engineId => this.activateSearchEngine(engineId),
			});
		}
	}

	async renderContent() {
		if (this.batchEdit) {
			this._renderBatchContent();

			return;
		}

		const filteredIds = this.getFilteredBookmarkIds();

		this.content.empty();

		if (!this.options.search && !filteredIds.length) {
			new Elem({
				style: {
					margin: '6px auto',
					padding: '6px 12px',
					textAlign: 'center',
				},
				appendTo: this.content,
				textContent: 'No bookmarks yet .. Create them with the + button above',
			});
		} else {
			this.renderBookmarksByCategory(filteredIds);

			if (this.options.search) this.renderSearchResults();
		}
	}

	showContextMenu(eventOrOptions) {
		const event = eventOrOptions.event || eventOrOptions;

		event.preventDefault();
		event.stopPropagation();

		if (this.batchEdit) return;

		const extraItems = eventOrOptions.items;

		const categoryId = event.target.closest?.('[data-category-id]')?.dataset.categoryId || undefined;
		const category = this.categories.body[categoryId] || {};

		const bookmarkId = event.target.href && event.target.id;
		const bookmark = this.bookmarks.body[bookmarkId] || {};

		const searchResult = !bookmarkId && event.target.href && event.target.textContent;

		this.contextMenu.options.items = conditionalList([
			{
				if: extraItems,
				thenItems: extraItems,
			},
			{
				if: searchResult,
				thenItem: {
					textContent: `Bookmark "${searchResult}"`,
					onPointerPress: () => new BookmarkDialog({ bookmark: { name: searchResult, url: event.target.href } }),
				},
			},
			{
				if: bookmarkId,
				thenItems: [
					{
						textContent: `Edit ${bookmark.name}`,
						onPointerPress: () => new BookmarkDialog({ bookmark }),
					},
					{
						textContent: `Delete ${bookmark.name}`,
						onPointerPress: () => confirmDeleteBookmark(bookmark),
					},
				],
			},
			{
				if: categoryId,
				thenItems: [
					{
						textContent: `Add Bookmark to ${category.name}`,
						onPointerPress: () => new BookmarkDialog({ category }),
					},
					{
						textContent: `Edit ${category.name}`,
						onPointerPress: () => new CategoryDialog({ category }),
					},
					{
						textContent: `Delete ${category.name}`,
						onPointerPress: () => new DeleteCategoryDialog({ category }),
					},
				],
			},
			{
				if: event.target.href,
				thenItem: {
					textContent: 'Copy URL To Clipboard',
					onPointerPress: () => copyToClipboard(event.target.href),
				},
			},
			{
				alwaysItems: [
					{
						textContent: 'Add Bookmark',
						onPointerPress: () => new BookmarkDialog(),
					},
					{
						textContent: 'Add Category',
						onPointerPress: () => new CategoryDialog(),
					},
					{
						textContent: 'Batch Edit',
						onPointerPress: () => this.enterBatchEdit(),
					},
				],
			},
		]);

		this.contextMenu.show({ x: event.clientX, y: event.clientY });
	}

	enterBatchEdit() {
		if (this.batchEdit) return;

		this.batchEdit = true;
		this.batchDirty = false;
		this.batch = this._buildBatchState();
		this._batchContainers = {};

		this.batchBar.elem.style.display = 'flex';
		this.batchBar.options.markedCount = 0;

		this.renderContent();
	}

	cancelBatchEdit() {
		this._exitBatchEdit();
	}

	_exitBatchEdit() {
		this.batchEdit = false;
		this.batch = null;
		this._batchContainers = null;

		this.batchBar.elem.style.display = 'none';

		this.renderContent();
	}

	_buildBatchState() {
		const batch = { bookmarks: {}, categories: {} };

		sortedIds(this.categories.body).forEach((id, index) => {
			batch.categories[id] = { ...this.categories.body[id], id, order: index, deleted: false };
		});

		const counters = {};

		for (const id of sortedIds(this.bookmarks.body)) {
			const bookmark = this.bookmarks.body[id];
			const categoryKey = this.categories.body[bookmark.category] ? bookmark.category : '';
			const order = (counters[categoryKey] = (counters[categoryKey] ?? -1) + 1);

			batch.bookmarks[id] = { ...bookmark, id, category: categoryKey, order, deleted: false };
		}

		return batch;
	}

	getBatchCategoryOrder() {
		return Object.values(this.batch.categories)
			.sort((a, b) => a.order - b.order)
			.map(category => category.id);
	}

	getBatchCategoryBookmarks(categoryId) {
		return Object.values(this.batch.bookmarks)
			.filter(bookmark => (bookmark.category || '') === (categoryId || ''))
			.sort((a, b) => a.order - b.order);
	}

	toggleBookmarkMark(id) {
		const marked = (this.batch.bookmarks[id].deleted = !this.batch.bookmarks[id].deleted);
		this.batchDirty = true;

		this._refreshMarkedCount();

		const link = this.content.elem.querySelector(`[data-bookmark-id="${id}"]`);
		link?.classList.toggle('markedForDeletion', marked);
	}

	toggleCategoryMark(id) {
		const marked = (this.batch.categories[id].deleted = !this.batch.categories[id].deleted);
		this.batchDirty = true;

		this._refreshMarkedCount();

		const container = this._batchContainers[id];
		if (container) container.options.categoryMarkedForDeletion = marked;
	}

	_refreshMarkedCount() {
		const markedBookmarks = Object.values(this.batch.bookmarks).filter(bookmark => bookmark.deleted).length;
		const markedCategories = Object.values(this.batch.categories).filter(category => category.deleted).length;

		this.batchBar.options.markedCount = markedBookmarks + markedCategories;
	}

	moveBookmark(bookmarkId, targetCategoryId, beforeBookmarkId) {
		const bookmark = this.batch.bookmarks[bookmarkId];

		if (!bookmark) return;

		const sourceCategoryKey = bookmark.category || '';
		const targetCategoryKey = targetCategoryId || '';

		bookmark.category = targetCategoryKey;

		const siblings = this.getBatchCategoryBookmarks(targetCategoryId).filter(sibling => sibling.id !== bookmarkId);
		const insertIndex = beforeBookmarkId ? siblings.findIndex(sibling => sibling.id === beforeBookmarkId) : -1;

		siblings.splice(insertIndex === -1 ? siblings.length : insertIndex, 0, bookmark);
		siblings.forEach((sibling, index) => {
			this.batch.bookmarks[sibling.id].order = index;
		});

		this.batchDirty = true;

		this._refreshBatchContainerBookmarks(targetCategoryKey);
		if (sourceCategoryKey !== targetCategoryKey) this._refreshBatchContainerBookmarks(sourceCategoryKey);
	}

	_refreshBatchContainerBookmarks(categoryKey) {
		const container = this._batchContainers[categoryKey];
		if (container) container.options.bookmarks = this._batchBookmarksFor(categoryKey);
	}

	_batchBookmarksFor(categoryId) {
		return this.getBatchCategoryBookmarks(categoryId).map(bookmark => ({
			...bookmark,
			markedForDeletion: bookmark.deleted,
		}));
	}

	moveCategory(categoryId, beforeCategoryId) {
		const order = this.getBatchCategoryOrder().filter(id => id !== categoryId);
		const insertIndex = beforeCategoryId ? order.indexOf(beforeCategoryId) : -1;

		order.splice(insertIndex === -1 ? order.length : insertIndex, 0, categoryId);
		order.forEach((id, index) => {
			this.batch.categories[id].order = index;
		});

		this.batchDirty = true;

		const container = this._batchContainers[categoryId];
		const beforeContainer = beforeCategoryId ? this._batchContainers[beforeCategoryId] : null;

		if (beforeContainer) this.content.elem.insertBefore(container.elem, beforeContainer.elem);
		else this.content.elem.append(container.elem);
	}

	_renderBatchContent() {
		this.content.empty();
		this._batchContainers = {};

		for (const categoryId of [undefined, ...this.getBatchCategoryOrder()]) {
			const category = categoryId ? this.batch.categories[categoryId] : { name: 'Bookmarks' };
			const categoryKey = categoryId || '';

			this._batchContainers[categoryKey] = new BookmarksContainer({
				appendTo: this.content,
				label: category.name,
				categoryId: categoryKey,
				batchEdit: true,
				categoryMarkedForDeletion: categoryId ? !!category.deleted : false,
				bookmarks: this._batchBookmarksFor(categoryId),
				onToggleBookmark: id => this.toggleBookmarkMark(id),
				onToggleCategory: id => this.toggleCategoryMark(id),
				...(category.color && {
					style: {
						width: 'calc(100% - 28px)',
						borderLeft: `4px solid ${new TinyColor(category.color).setAlpha(0.4)}`,
					},
				}),
			});
		}
	}

	async commitBatchEdit() {
		if (!this.batchDirty) {
			this._exitBatchEdit();

			return;
		}

		const bookmarks = Object.values(this.batch.bookmarks);
		const categories = Object.values(this.batch.categories);

		const deletedCategoryIds = new Set(categories.filter(category => category.deleted).map(category => category.id));
		const doomedBookmarks = bookmarks.filter(bookmark => bookmark.deleted || deletedCategoryIds.has(bookmark.category));
		const doomedBookmarkIds = new Set(doomedBookmarks.map(bookmark => bookmark.id));

		const survivingBookmarks = bookmarks.filter(bookmark => !doomedBookmarkIds.has(bookmark.id));
		const survivingCategories = categories.filter(category => !deletedCategoryIds.has(category.id));
		const doomedCategories = categories.filter(category => deletedCategoryIds.has(category.id));

		if (doomedBookmarks.length > 0 || doomedCategories.length > 0) {
			const confirmed = await confirmBatchDelete(doomedBookmarks.length, doomedCategories.length);

			if (!confirmed) return;
		}

		await Promise.all([
			...survivingBookmarks.map(bookmark =>
				updateBookmark(bookmark.id, { body: { category: bookmark.category, order: bookmark.order } }),
			),
			...survivingCategories.map(category => updateCategory(category.id, { body: { order: category.order } })),
		]);

		if (doomedBookmarks.length > 0 || doomedCategories.length > 0) {
			await deleteWithUndo({ bookmarks: doomedBookmarks, categories: doomedCategories });
		}

		this._exitBatchEdit();
	}

	_setupBatchDnd() {
		const content = this.content.elem;

		const onDragStart = event => {
			if (!this.batchEdit) return;

			const bookmarkElem = event.target.closest?.('[data-bookmark-id]');
			const categoryElem = !bookmarkElem && event.target.closest?.('[data-category-id]');

			if (bookmarkElem) this._dragging = { type: 'bookmark', id: bookmarkElem.dataset.bookmarkId };
			else if (categoryElem?.dataset.categoryId) {
				this._dragging = { type: 'category', id: categoryElem.dataset.categoryId };
			} else {
				event.preventDefault();

				return;
			}

			event.dataTransfer.effectAllowed = 'move';
		};

		const onDragOver = event => {
			if (!this._dragging) return;

			event.preventDefault();

			const hovered = this._dragging.type === 'bookmark' ? event.target.closest?.('[data-category-id]') : null;

			if (this._dragOverElem && this._dragOverElem !== hovered) this._dragOverElem.classList.remove('dragOverCategory');
			if (hovered) hovered.classList.add('dragOverCategory');

			this._dragOverElem = hovered || null;
		};

		const onDrop = event => {
			if (!this._dragging) return;

			event.preventDefault();

			this._dragOverElem?.classList.remove('dragOverCategory');
			this._dragOverElem = null;

			if (this._dragging.type === 'bookmark') this._handleBookmarkDrop(event, this._dragging.id);
			else this._handleCategoryDrop(event, this._dragging.id);

			this._dragging = null;
		};

		const onDragEnd = () => {
			this._dragOverElem?.classList.remove('dragOverCategory');
			this._dragOverElem = null;
			this._dragging = null;
		};

		content.addEventListener('dragstart', onDragStart);
		content.addEventListener('dragover', onDragOver);
		content.addEventListener('drop', onDrop);
		content.addEventListener('dragend', onDragEnd);

		this.addCleanup('batchDnd', () => {
			content.removeEventListener('dragstart', onDragStart);
			content.removeEventListener('dragover', onDragOver);
			content.removeEventListener('drop', onDrop);
			content.removeEventListener('dragend', onDragEnd);
		});
	}

	_handleBookmarkDrop(event, bookmarkId) {
		const targetContainer = event.target.closest?.('[data-category-id]');

		if (!targetContainer) return;

		const targetCategoryId = targetContainer.dataset.categoryId;
		const siblingLinks = [...targetContainer.querySelectorAll('[data-bookmark-id]')].filter(
			elem => elem.dataset.bookmarkId !== bookmarkId,
		);

		let beforeBookmarkId = null;

		for (const link of siblingLinks) {
			const rect = link.getBoundingClientRect();

			if (event.clientY < rect.bottom && event.clientX < rect.left + rect.width / 2) {
				beforeBookmarkId = link.dataset.bookmarkId;

				break;
			}
		}

		this.moveBookmark(bookmarkId, targetCategoryId, beforeBookmarkId);
	}

	_handleCategoryDrop(event, categoryId) {
		const containers = [...this.content.elem.children].filter(
			elem => elem.dataset.categoryId && elem.dataset.categoryId !== categoryId,
		);

		let beforeCategoryId = null;

		for (const container of containers) {
			const rect = container.getBoundingClientRect();

			if (event.clientY < rect.top + rect.height / 2) {
				beforeCategoryId = container.dataset.categoryId;

				break;
			}
		}

		this.moveCategory(categoryId, beforeCategoryId);
	}
}
