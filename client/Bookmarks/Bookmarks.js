import uFuzzy from '@leeoniya/ufuzzy';
import { View, NoData } from 'vanilla-bean-components';

import { deleteBookmark, deleteCategory, getBookmarks, getCategories, getSearchResults } from '../api';

import { Content } from '../Layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';
import ContextMenu from './ContextMenu';

import { fixLink, copyToClipboard } from './util';

const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 5, intraSub: 1, intraTrn: 1, intraDel: 1 });

export default class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: event => this.showContextMenu({ event }),
			...options,
		});

		this.onPointerUp(() => {
			this.toolbar?.contextMenu?.hide();

			if (!this.contextMenu) return;

			if (this.contextMenu.opened) this.contextMenu.hide();

			this.contextMenu.opened = true;
		});
	}

	async render(options = this.options) {
		super.render(options);

		this.toolbar = new BookmarksToolbar({
			appendTo: this.elem,
			search: term => {
				if (this.options.search === term) return;

				this.options.search = term;
			},
		});

		this.content = new Content({ appendTo: this.elem });

		this.renderContent();
	}

	setOption(key, value) {
		if (key === 'categories' || key === 'bookmarks') return;

		if (key === 'search') {
			this.renderContent();
		} else super.setOption(key, value);
	}

	async renderContent() {
		const searchTerm = this.options.search;

		const categories = (await getCategories({ onRefetch: this.renderContent.bind(this) })).body;
		const bookmarks = (await getBookmarks({ onRefetch: this.renderContent.bind(this) })).body;
		const suggestions = (await getSearchResults(searchTerm, { onRefetch: this.renderContent.bind(this) })).body;

		const bookmarkIds = Object.keys(bookmarks);

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

			const filteredNames =
				searchTerm &&
				new Set(
					fuzzy.filter(
						bookmarkIds.map(id => bookmarks[id].name),
						searchTerm,
					),
				);

			const filteredBookmarks = searchTerm ? bookmarkIds.filter((id, index) => filteredNames.has(index)) : bookmarkIds;

			this.content.append(
				[undefined, ...Object.keys(categories)].map(categoryId => {
					const category = categories[categoryId] || { name: 'Bookmarks' };

					return new BookmarksContainer({
						appendTo: this.content,
						heading: category.name,
						color: category.color,
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
}
