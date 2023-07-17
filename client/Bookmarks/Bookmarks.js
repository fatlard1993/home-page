import { DomElem, View, NoData, Overlay, Menu } from 'vanilla-bean-components';

import { deleteBookmark, deleteCategory, getBookmarks, getSearchResults } from '../services';
import state from '../state';

import { Content } from '../layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';

export class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: event => {
				event.stop();

				this.showContextMenu({
					x: event.clientX,
					y: event.clientY,
					items: [
						{
							textContent: 'Add Bookmark',
							onPointerPress: () => new BookmarkDialog({ appendTo: this.elem }),
						},
						{
							textContent: 'Add Category',
							onPointerPress: () => new CategoryDialog({ appendTo: this.elem }),
						},
					],
				});
			},
			...options,
		});

		this.onPointerUp(this.hideContextMenu);
	}

	render(options = this.options) {
		super.render(options);

		const appendTo = this.elem;

		this.toolbar = new BookmarksToolbar({ appendTo, search: this.search.bind(this) });

		this.content = new Content({ appendTo });

		this.update();
	}

	renderContent() {
		const { bookmarkIds, bookmarks, searchResults, categories, term } = state.serverState;

		this.content.empty();

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: this.content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					heading: 'Search Results',
					bookmarks: searchResults.map(search => ({ name: search, url: search })),
				});
			}

			this.content.append(
				[undefined, ...Object.keys(categories)].map(categoryId => {
					const category = categories[categoryId] || { name: 'Bookmarks' };

					return new BookmarksContainer({
						appendTo: this.content,
						heading: new DomElem({
							tag: 'h2',
							textContent: category.name,
							onContextMenu:
								categoryId &&
								(event => {
									event.stop();

									this.showContextMenu({
										x: event.clientX,
										y: event.clientY,
										items: [
											{
												textContent: `Add Bookmark to ${category.name}`,
												onPointerPress: () => new BookmarkDialog({ category, appendTo: this.elem }),
											},
											{
												textContent: `Edit ${category.name}`,
												onPointerPress: () => new CategoryDialog({ appendTo: this.elem, category }),
											},
											{
												textContent: `Delete ${category.name}`,
												onPointerPress: () => {
													deleteCategory(categoryId).then(() => {
														state.router.renderView();
													});
												},
											},
										],
									});
								}),
						}),
						bookmarks: bookmarkIds
							.filter(id => bookmarks[id].category === categoryId || (!categoryId && !categories[bookmarks[id].category]))
							.filter(id => !term || bookmarks[id].name.toLowerCase().includes(term.toLowerCase()))
							.map(id => ({
								...bookmarks[id],
								onContextMenu: event => {
									event.stop();

									this.showContextMenu({
										x: event.clientX,
										y: event.clientY,
										items: [
											{
												textContent: `Edit ${bookmarks[id].name}`,
												onPointerPress: () => new BookmarkDialog({ appendTo: this.elem, bookmark: bookmarks[id] }),
											},
											{
												textContent: `Delete ${bookmarks[id].name}`,
												onPointerPress: () => {
													deleteBookmark(id).then(() => {
														state.router.renderView();
													});
												},
											},
										],
									});
								},
							})),
					});
				}),
			);
		}
	}

	async update(serverState) {
		if (!serverState) serverState = await getBookmarks();

		state.serverState = serverState;

		this.renderContent();
	}

	showContextMenu({ x, y, items }) {
		this.hideContextMenu();

		const maxWidth = 240;
		const itemHeight = 36;
		const pastRight = x + maxWidth >= document.body.clientWidth;
		const pastBottom = y + items.length * itemHeight >= document.body.clientHeight;

		this.openingContextMenu = true;
		this.contextMenu = new Overlay({
			appendTo: this.elem,
			styles: () => `
				max-width: ${maxWidth}px;
				top: ${pastBottom ? 'unset' : `${y}px`};
				bottom: ${pastBottom ? `${document.body.clientHeight - y}px` : 'unset'};
				left: ${pastRight ? 'unset' : `${x}px`};
				right: ${pastRight ? `${document.body.clientWidth - x}px` : 'unset'};
			`,
			append: new Menu({
				styles: () => `
					li {
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				`,
				items,
			}),
		});

		setTimeout(() => (this.openingContextMenu = false), 300);
	}

	hideContextMenu() {
		if (this.openingContextMenu) {
			this.openingContextMenu = false;
			return;
		}

		this.contextMenu?.remove();
	}

	search(term) {
		if (!term) return this.update({ ...state.serverState, term, searchResults: [] });

		getSearchResults(term).then(({ suggestions }) => this.update({ ...state.serverState, term, searchResults: suggestions }));
	}
}
