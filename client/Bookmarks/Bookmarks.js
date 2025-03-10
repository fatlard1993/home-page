import uFuzzy from '@leeoniya/ufuzzy';
import { View, Elem, copyToClipboard, Icon, conditionalList } from 'vanilla-bean-components';
import { TinyColor } from '@ctrl/tinycolor';

import { deleteBookmark, getBookmarks, getCategories, getSearchResults } from '../api';

import { Content } from '../Layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';
import ContextMenu from './ContextMenu';

import { fixLink } from './util';
import DeleteCategoryDialog from './DeleteCategoryDialog';

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

		this.categories = await getCategories({
			onRefetch: response => {
				this.categories = response;

				if (this.rendered) this.renderContent();
			},
		});

		this.bookmarks = await getBookmarks({
			onRefetch: response => {
				this.bookmarks = response;

				if (this.rendered) this.renderContent();
			},
		});

		this.searchResults = await getSearchResults(this.options.search, {
			onRefetch: response => {
				this.searchResults = response;

				if (this.rendered) this.renderContent();
			},
		});

		this.options.onDisconnected = () => {
			this.categories.unsubscribe();
			this.bookmarks.unsubscribe();
			this.searchResults.unsubscribe();
		};

		super.render();

		await this.renderContent();
	}

	_setOption(key, value) {
		if (key === 'search') {
			this.renderLoader();

			if (value) this.searchResults.refetch({ enabled: value.length > 0, urlParameters: { term: value } });
			else if (this.rendered) this.renderContent();
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

	async renderContent() {
		const bookmarkIds = Object.keys(this.bookmarks.body);

		this.content.empty();

		if (!this.options.search && !bookmarkIds?.length) {
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
			if (this.options.search && this.searchResults.body?.google?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					label: 'Google Search Results',
					bookmarks: this.searchResults.body.google.slice(0, 5).map(search => ({
						name: search,
						url: search,
						onContextMenu: event =>
							this.showContextMenu({
								event,
								items: [
									{
										textContent: `Bookmark "${search}"`,
										onPointerPress: () => new BookmarkDialog({ bookmark: { name: search, url: fixLink(search) } }),
									},
								],
							}),
					})),
				});
			}

			if (this.options.search && this.searchResults.body?.stardew?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					label: 'Stardew Wiki Search Results',
					bookmarks: this.searchResults.body.stardew.slice(0, 5).map(search => ({
						name: search.replace('https://stardewvalleywiki.com/', ''),
						url: search,
						onContextMenu: event =>
							this.showContextMenu({
								event,
								items: [
									{
										textContent: `Bookmark "${search}"`,
										onPointerPress: () =>
											new BookmarkDialog({
												bookmark: { name: search.replace('https://stardewvalleywiki.com/', ''), url: fixLink(search) },
											}),
									},
								],
							}),
					})),
				});
			}

			if (this.options.search && this.searchResults.body?.scryfall?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					label: 'Scryfall Search Results',
					bookmarks: this.searchResults.body.scryfall.slice(0, 5).map(search => ({
						name: search.name,
						url: search.scryfall_uri,
						onContextMenu: event =>
							this.showContextMenu({
								event,
								items: [
									{
										textContent: `Bookmark "${search}"`,
										onPointerPress: () =>
											new BookmarkDialog({
												bookmark: { name: search.name, url: fixLink(search.scryfall_uri) },
											}),
									},
								],
							}),
					})),
				});
			}

			const bookmarkHaystack = bookmarkIds.flatMap(id => [
				{ id, hay: this.bookmarks.body[id].name },
				{ id, hay: this.bookmarks.body[id].url },
			]);
			const suggestions =
				this.options.search &&
				fuzzy.filter(
					bookmarkHaystack.map(({ hay }) => hay),
					this.options.search,
				);
			const suggestedBookmarkIds = [
				...new Set(suggestions?.map?.(haystackIndex => bookmarkHaystack[haystackIndex].id)),
			];
			const filteredBookmarkIds = this.options.search ? suggestedBookmarkIds : bookmarkIds;

			[undefined, ...Object.keys(this.categories.body)].forEach(categoryId => {
				const category = this.categories.body[categoryId] || { name: 'Bookmarks' };
				const categoryBookmarks = filteredBookmarkIds
					.filter(
						id =>
							this.bookmarks.body[id].category === categoryId ||
							(!categoryId && !this.categories.body[this.bookmarks.body[id].category]),
					)
					.map(id => this.bookmarks.body[id]);

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
			});
		}
	}

	showContextMenu(event) {
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
				alwaysItems: [
					{
						textContent: 'Copy URL To Clipboard',
						onPointerPress: () => copyToClipboard(event.target.href),
					},
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
