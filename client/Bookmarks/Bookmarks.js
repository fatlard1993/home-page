import uFuzzy from '@leeoniya/ufuzzy';
import { View, DomElem, copyToClipboard } from 'vanilla-bean-components';

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
			onContextMenu: event => this.showContextMenu({ event }),
			...options,
		});

		this.options.onPointerUp = () => {
			this.toolbar?.contextMenu?.elem?.remove();

			if (!this.contextMenu) return;

			if (this.contextMenu.opened) this.contextMenu.elem.remove();

			this.contextMenu.opened = true;
		};
	}

	async render() {
		this.options.categories = await getCategories({ onRefetch: response => (this.options.categories = response) });
		this.options.bookmarks = await getBookmarks({ onRefetch: response => (this.options.bookmarks = response) });
		this.options.searchResults = await getSearchResults(this.options.search, {
			onRefetch: response => (this.options.searchResults = response),
		});

		this.options.onDisconnected = () => {
			this.options.categories.unsubscribe();
			this.options.bookmarks.unsubscribe();
			this.options.searchResults.unsubscribe();
		};

		super.render();

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
		if (key === 'categories' || key === 'bookmarks' || key === 'searchResults') {
			if (this.rendered) this.renderContent();
		} else if (key === 'search') {
			this.options.searchResults.refetch({ enabled: value.length > 0, urlParameters: { term: value } });

			if (value.length === 0) this.renderContent();
		} else super.setOption(key, value);
	}

	async renderContent() {
		const bookmarkIds = Object.keys(this.options.bookmarks.body);

		this.content.empty();

		if (!this.options.search && !bookmarkIds?.length) {
			new DomElem({
				styles: () => `
					margin: 6px auto;
					padding: 6px 12px;
					text-align: center;
				`,
				appendTo: this.content,
				textContent: 'No bookmarks yet .. Create them with the + button above',
			});
		} else {
			if (this.options.searchResults.body?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					heading: 'Search Results',
					bookmarks: this.options.searchResults.body.slice(0, 5).map(search => ({
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

			const filteredNames =
				this.options.search &&
				new Set(
					fuzzy.filter(
						bookmarkIds.map(id => this.options.bookmarks.body[id].name),
						this.options.search,
					),
				);

			const filteredBookmarks = this.options.search
				? bookmarkIds.filter((id, index) => filteredNames.has(index))
				: bookmarkIds;

			this.content.append(
				[undefined, ...Object.keys(this.options.categories.body)].map(categoryId => {
					const category = this.options.categories.body[categoryId] || { name: 'Bookmarks' };

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
											onPointerPress: () => new DeleteCategoryDialog({ category }),
										},
									],
								})),
						bookmarks: filteredBookmarks
							.filter(
								id =>
									this.options.bookmarks.body[id].category === categoryId ||
									(!categoryId && !this.options.categories.body[this.options.bookmarks.body[id].category]),
							)
							.map(id => ({
								...this.options.bookmarks.body[id],
								onContextMenu: event =>
									this.showContextMenu({
										event,
										items: [
											{
												textContent: `Edit ${this.options.bookmarks.body[id].name}`,
												onPointerPress: () => new BookmarkDialog({ bookmark: this.options.bookmarks.body[id] }),
											},
											{
												textContent: `Delete ${this.options.bookmarks.body[id].name}`,
												onPointerPress: () => deleteBookmark(id),
											},
											{
												textContent: 'Copy To Clipboard',
												onPointerPress: () => copyToClipboard(this.options.bookmarks.body[id].url),
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

		this.contextMenu?.elem.remove();

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
			x: event.clientX + 6,
			y: event.clientY + 6,
			...options,
			items,
		});
	}
}
