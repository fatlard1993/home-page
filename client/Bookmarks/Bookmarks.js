import uFuzzy from '@leeoniya/ufuzzy';
import { View, Elem, copyToClipboard, Icon, conditionalList } from '@vanilla-bean/components';
import { TinyColor } from '@ctrl/tinycolor';

import { orderBy } from '@vanilla-bean/components';

import { deleteBookmark, getBookmarks, getCategories, getSearchEngines, getSearchResult } from '../api';

import { Content } from '../Layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';
import ContextMenu from './ContextMenu';

import { fixLink } from './util';
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
		this.content = new Content({ appendTo: this.elem });
		this.contextMenu = new ContextMenu({ appendTo: this });

		this.renderLoader();

		this._subscriptions = [];

		this.categories = await this._subscribe(getCategories({
			onSuccess: response => {
				this.categories = response;

				if (this.rendered) this.renderContent();
			},
		}));

		this.bookmarks = await this._subscribe(getBookmarks({
			onSuccess: response => {
				this.bookmarks = response;

				if (this.rendered) this.renderContent();
			},
		}));

		this.searchResults = {};

		this.engines = await this._subscribe(getSearchEngines({
			onSuccess: async response => {
				this.engines = response;

				this._unsubscribeSearchResults();
				await this.subscribeSearchResults();

				if (this.rendered) this.renderContent();
			},
		}));

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

	async subscribeSearchResults() {
		this.searchResults = {};

		for (const engine of Object.values(this.engines.body)) {
			this.searchResults[engine.id] = await this._subscribe(getSearchResult(engine.id, this.options.search, {
				onSuccess: response => {
					this.searchResults[engine.id] = response;

					if (this.rendered) this.renderContent();
				},
			}));
		}
	}

	_setOption(key, value) {
		if (key === 'search') {
			if (value) {
				this.renderLoader();

				for (const engine of Object.values(this.engines.body)) {
					this.searchResults[engine.id].refetch({
						enabled: value.length > 0,
						urlParameters: { provider: engine.id, term: value },
					});
				}
			} else if (this.rendered) this.renderContent();
		} else super._setOption(key, value);
	}

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
		return filteredIds
			.filter(
				id =>
					this.bookmarks.body[id].category === categoryId ||
					// Uncategorized bucket: no categoryId and bookmark's category doesn't exist
					(!categoryId && !this.categories.body[this.bookmarks.body[id].category]),
			)
			.map(id => this.bookmarks.body[id]);
	}

	renderBookmarksByCategory(filteredIds) {
		for (const categoryId of [undefined, ...Object.keys(this.categories.body)]) {
			const category = this.categories.body[categoryId] || { name: 'Bookmarks' };
			const categoryBookmarks = this.getCategoryBookmarks(categoryId, filteredIds);

			if (categoryBookmarks.length > 0) {
				new BookmarksContainer({
					appendTo: this.content,
					label: category.name,
					categoryId,
					bookmarks: categoryBookmarks,
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
		for (const engine of Object.values(this.engines.body)) {
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
									onPointerPress: () =>
										new BookmarkDialog({ bookmark: { name: item.name, url: fixLink(item.url) } }),
								},
							],
						}),
				})),
			});
		}
	}

	async renderContent() {
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
		const extraItems = eventOrOptions.items;

		event.preventDefault();
		event.stopPropagation();

		// Support 3 levels of nesting to account for targeting the container, the link container, or the links themselves
		const categoryId =
			event.target?._elem?.options?.categoryId ||
			event.target?.parentElement?._elem?.options?.categoryId ||
			event.target?.parentElement?.parentElement?._elem?.options?.categoryId;
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
						onPointerPress: () => deleteBookmark(bookmarkId),
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
				],
			},
		]);

		this.contextMenu.show({ x: event.clientX, y: event.clientY });
	}
}
