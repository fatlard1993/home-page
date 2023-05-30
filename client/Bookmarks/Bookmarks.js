import { DomElem, View, NoData, Link, Overlay, Menu, styled } from 'vanilla-bean-components';

import { Content } from '../layout';
import CategoryDialog from './CategoryDialog';
import BookmarkDialog from './BookmarkDialog';
import BookmarksToolbar from './BookmarksToolbar';
import BookmarksContainer from './BookmarksContainer';

import { deleteBookmark, deleteCategory, getBookmarks, getSearchResults } from '../services';
import { fixLink } from './util';

import state from '../state';

const BookmarkLink = styled(
	Link,
	() => `
		margin: 0;
	`,
);

export class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: evt => {
				evt.stop();

				this.showContextMenu({
					x: evt.clientX,
					y: evt.clientY,
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
		const { bookmarkIds, bookmarks, searchResults, categories } = state.serverState;

		this.content.empty();

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: this.content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults?.length) {
				new BookmarksContainer({
					appendTo: this.content,
					heading: 'Search Results',
					appendChildren: searchResults.map(search => new BookmarkLink({ textContent: search, href: fixLink(search) })),
				});
			}

			console.log({ categories, bookmarks });

			this.content.appendChildren(
				[undefined, ...Object.keys(categories)].map(categoryId => {
					const category = categories[categoryId] || { name: 'Bookmarks' };

					return new BookmarksContainer({
						appendTo: this.content,
						heading: new DomElem({
							tag: 'h2',
							styles: () => 'cursor: pointer;',
							textContent: category.name,
							onContextMenu:
								categoryId &&
								(evt => {
									evt.stop();

									this.showContextMenu({
										x: evt.clientX,
										y: evt.clientY,
										items: [
											{
												textContent: `Edit ${category.name}`,
												onPointerPress: () => new CategoryDialog({ appendTo: this.elem, category }),
											},
											{
												textContent: `Delete ${category.name}`,
												onPointerPress: () => {
													deleteCategory(categoryId).then(data => {
														console.log('Success:', data);
														state.router.renderView();
													});
												},
											},
										],
									});
								}),
						}),
						appendChildren: bookmarkIds
							.filter(id => bookmarks[id].category === categoryId || (!categoryId && !categories[bookmarks[id].category]))
							.map(id => {
								const bookmark = bookmarks[id];
								const { name: textContent, url: href, color: backgroundColor } = bookmark;

								const link = new BookmarkLink({
									styles: ({ colors }) => `
											background: ${backgroundColor};
											color: ${colors.mostReadable(backgroundColor, [colors.white, colors.black])}
										`,
									textContent,
									href,
									onContextMenu: evt => {
										evt.stop();

										this.showContextMenu({
											x: evt.clientX,
											y: evt.clientY,
											items: [
												{
													textContent: `Edit ${textContent}`,
													onPointerPress: () => new BookmarkDialog({ appendTo: this.elem, bookmark }),
												},
												{
													textContent: `Delete ${textContent}`,
													onPointerPress: () => {
														deleteBookmark(id).then(data => {
															console.log('Success:', data);
															state.router.renderView();
														});
													},
												},
											],
										});
									},
								});

								return link;
							}),
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
			style: {
				maxWidth: `${maxWidth}px`,
				top: pastBottom ? 'unset' : `${y}px`,
				bottom: pastBottom ? `${document.body.clientHeight - y}px` : 'unset',
				left: pastRight ? 'unset' : `${x}px`,
				right: pastRight ? `${document.body.clientWidth - x}px` : 'unset',
			},
			appendChild: new Menu({
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
		if (!term) return this.update({ ...state.serverState, searchResults: [] });

		getSearchResults(term).then(({ suggestions }) => this.update({ ...state.serverState, searchResults: suggestions }));
	}

	remove() {
		if (this.list?.remove) this.list.remove();

		super.remove();
	}
}
