import uFuzzy from '@leeoniya/ufuzzy';
import { View, NoData } from 'vanilla-bean-components';

import { deleteBookmark, deleteCategory, getBookmarks, getSearchResults } from '../api';

import state from '../state';

import { Content } from '../Layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';
import ContextMenu from './ContextMenu';

import { fixLink, copyToClipboard } from './util';

const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 3, intraSub: 1, intraTrn: 1, intraDel: 1 });

export class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: event => this.showContextMenu({ event }),
			...options,
		});

		this.onPointerUp(() => {
			this.toolbar?.contextMenu?.hide();

			if (this.contextMenu?.opened) this.contextMenu?.hide();

			this.contextMenu.opened = true;
		});
	}

	async render(options = this.options) {
		super.render(options);

		this.toolbar = new BookmarksToolbar({ appendTo: this.elem, search: this.search.bind(this) });

		this.content = new Content({ appendTo: this.elem });

		this.options.bookmarks = await getBookmarks();
	}

	setOption(key, value) {
		if (key === 'bookmarks') {
			this.renderContent(value);
		} else if (key === 'search') {
			this.renderContent({ ...this.options.bookmarks, suggestions: value.suggestions, term: value.term });
		} else super.setOption(key, value);
	}

	renderContent(serverState = this.options.serverState) {
		state.serverState = serverState;

		const { bookmarkIds, bookmarks, suggestions, categories, term = '' } = serverState;

		this.content.empty();

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: this.content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (suggestions?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					heading: 'Search Results',
					bookmarks: suggestions.slice(0, 5).map(search => ({
						name: search,
						url: search,
						onContextMenu: event =>
							this.showContextMenu({
								event,
								items: [
									{
										textContent: `Bookmark ${search}`,
										onPointerPress: () => new BookmarkDialog({ bookmark: { name: search, url: fixLink(search) } }),
									},
								],
							}),
					})),
				});
			}

			const filteredNames = new Set(
				fuzzy.filter(
					bookmarkIds.map(id => bookmarks[id].name),
					term,
				),
			);

			const filteredBookmarks = bookmarkIds.filter((id, index) => !term || filteredNames.has(index));

			this.content.append(
				[undefined, ...Object.keys(categories)].map(categoryId => {
					const category = categories[categoryId] || { name: 'Bookmarks' };

					return new BookmarksContainer({
						appendTo: this.content,
						heading: category.name,
						onContextMenu:
							categoryId &&
							(event =>
								this.showContextMenu({
									event,
									items: [
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
											onPointerPress: () => {
												deleteCategory(categoryId).then(() => this.render());
											},
										},
									],
								})),
						bookmarks: filteredBookmarks
							.filter(id => bookmarks[id].category === categoryId || (!categoryId && !categories[bookmarks[id].category]))
							.map(id => ({
								...bookmarks[id],
								onContextMenu: event =>
									this.showContextMenu({
										event,
										items: [
											{
												textContent: `Edit ${bookmarks[id].name}`,
												onPointerPress: () => new BookmarkDialog({ bookmark: bookmarks[id] }),
											},
											{
												textContent: `Delete ${bookmarks[id].name}`,
												onPointerPress: () => {
													deleteBookmark(id).then(() => this.render());
												},
											},
											{
												textContent: 'Copy To Clipboard',
												onPointerPress: () => {
													copyToClipboard(bookmarks[id].url);
												},
											},
										],
									}),
							})),
					});
				}),
			);
		}
	}

	showContextMenu({ items = [], event, ...options }) {
		event.preventDefault();
		event.stopPropagation();

		this.contextMenu?.hide();

		items.push(
			{
				textContent: 'Add Bookmark',
				onPointerPress: () => new BookmarkDialog(),
			},
			{
				textContent: 'Add Category',
				onPointerPress: () => new CategoryDialog(),
			},
		);

		this.contextMenu = new ContextMenu({
			appendTo: this.elem,
			x: event.clientX,
			y: event.clientY,
			...options,
			items,
		});
	}

	async search(term) {
		if (!term) return (this.options.search = { suggestions: [], term });

		const { suggestions } = await getSearchResults(term);

		this.options.search = { suggestions, term };
	}
}
