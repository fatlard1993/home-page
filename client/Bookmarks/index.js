import './index.css';

import { mostReadable } from '@ctrl/tinycolor';

import { DomElem, View, IconButton, NoData, Link, Search, Overlay, Menu, debounceCb } from 'vanilla-bean-components';

import { Content, Toolbar } from '../layout';
import BookmarkDialog from '../BookmarkDialog';
import CategoryDialog from '../CategoryDialog';
import { fixLink } from './util';
import state from '../state';

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

		const search = new Search({
			onKeyUp: ({ key }) => {
				debounceCb(() => this.search(search.elem.value), 700);

				if (key === 'Enter') this.search(search.elem.value);
			},
		});

		new Toolbar({
			appendTo,
			appendChildren: [
				search,
				new IconButton({
					icon: 'plus',
					onPointerPress: () => new BookmarkDialog({ appendTo }),
				}),
			],
		});

		this.content = new Content({ appendTo });

		this.update();
	}

	renderContent() {
		const { bookmarkIds, bookmarks, searchResults, categories } = state.serverState;

		this.content.empty();

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: this.content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults) {
				new DomElem({
					appendTo: this.content,
					className: 'bookmarksContainer search',
					appendChildren: [new DomElem({ tag: 'h2', textContent: 'Search Results' }), ...searchResults.map(search => new Link({ textContent: search, href: fixLink(search) }))],
				});
			}

			console.log({ categories, bookmarks });

			this.content.appendChildren(
				[undefined, ...Object.keys(categories)].map(categoryId => {
					const category = categories[categoryId] || { name: 'Bookmarks' };

					return new DomElem({
						appendTo: this.content,
						className: 'bookmarksContainer',
						appendChildren: [
							new DomElem({
								tag: 'h2',
								textContent: category.name,
								onContextMenu: categoryId
									? evt => {
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
															fetch(`/bookmarks/categories/${categoryId}`, {
																method: 'DELETE',
																headers: { 'Content-Type': 'application/json' },
															})
																.then(response => response.json())
																.then(data => {
																	console.log('Success:', data);
																	state.router.renderView();
																})
																.catch(error => {
																	console.error('Error:', error);
																});
														},
													},
												],
											});
									  }
									: undefined,
							}),
							...bookmarkIds
								.filter(id => bookmarks[id].category === categoryId || (!categoryId && !categories[bookmarks[id].category]))
								.map(id => {
									const bookmark = bookmarks[id];
									const { name: textContent, url: href, color: backgroundColor } = bookmark;

									const link = new Link({
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
															fetch(`/bookmarks/${id}`, {
																method: 'DELETE',
																headers: { 'Content-Type': 'application/json' },
															})
																.then(response => response.json())
																.then(data => {
																	console.log('Success:', data);
																	state.router.renderView();
																})
																.catch(error => {
																	console.error('Error:', error);
																});
														},
													},
												],
											});
										},
										style: { backgroundColor, color: mostReadable(backgroundColor, ['hsl(0, 0%, 10%)', 'hsl(0, 0%, 90%)']) },
									});

									return link;
								}),
						],
					});
				}),
			);

			// new DomElem({
			// 	appendTo: this.content,
			// 	className: 'bookmarksContainer',
			// 	appendChildren: [
			// 		new DomElem({ tag: 'h2', textContent: 'Bookmarks' }),
			// 		...bookmarkIds.map(id => {
			// 			const bookmark = bookmarks[id];
			// 			const { name: textContent, url: href, color: backgroundColor } = bookmark;

			// 			const link = new Link({
			// 				textContent,
			// 				href,
			// 				onContextMenu: evt => {
			// 					evt.stop();

			// 					this.showContextMenu({
			// 						x: evt.clientX,
			// 						y: evt.clientY,
			// 						items: [
			// 							{
			// 								textContent: `Edit ${textContent}`,
			// 								onPointerPress: () => new BookmarkDialog({ appendTo: this.elem, bookmark }),
			// 							},
			// 							{
			// 								textContent: `Delete ${textContent}`,
			// 								onPointerPress: () => {
			// 									fetch(`/bookmarks/${bookmark.id}`, {
			// 										method: 'DELETE',
			// 										headers: { 'Content-Type': 'application/json' },
			// 									})
			// 										.then(response => response.json())
			// 										.then(data => {
			// 											console.log('Success:', data);
			// 											state.router.renderView();
			// 										})
			// 										.catch(error => {
			// 											console.error('Error:', error);
			// 										});
			// 								},
			// 							},
			// 						],
			// 					});
			// 				},
			// 				style: { backgroundColor, color: mostReadable(backgroundColor, ['hsl(0, 0%, 10%)', 'hsl(0, 0%, 90%)']) },
			// 			});

			// 			return link;
			// 		}),
			// 	],
			// });
		}
	}

	update(serverState) {
		if (!serverState) {
			fetch('/bookmarks')
				.then(response => response.json())
				.then(serverState => this.update(serverState));

			return undefined;
		}

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
			appendChild: new Menu({ items }),
		});

		setTimeout(() => (this.openingContextMenu = false), 300);
	}

	hideContextMenu() {
		if (this.openingContextMenu) {
			this.openingContextMenu = false;
			return;
		}

		this.contextMenu?.cleanup();
	}

	search(term) {
		if (!term) return this.update({ ...state.serverState, searchResults: [] });

		fetch(`/search/${term}`)
			.then(response => response.json())
			.then(({ suggestions }) => this.update({ ...state.serverState, searchResults: suggestions }));
	}

	cleanup() {
		if (this.list?.cleanup) this.list.cleanup();

		super.cleanup();
	}
}
