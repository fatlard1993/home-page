import './index.css';

import { mostReadable } from '@ctrl/tinycolor';

import { DomElem, View, IconButton, NoData, Link, Search, Overlay, Menu, debounceCb } from 'vanilla-bean-components';

import { Content, Toolbar } from '../layout';
import BookmarkDialog from '../BookmarkDialog';
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
		const { bookmarkIds, bookmarks, searchResults } = state.serverState;

		this.content.empty();

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: this.content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults) {
				new DomElem({
					appendTo: this.content,
					className: 'bookmarksContainer search',
					appendChildren: [new DomElem('h2', { textContent: 'Search' }), ...searchResults.map(search => new Link({ textContent: search, href: fixLink(search) }))],
				});
			}

			new DomElem({
				appendTo: this.content,
				className: 'bookmarksContainer',
				appendChildren: [
					new DomElem({ tag: 'h2', textContent: 'Bookmarks' }),
					...bookmarkIds.map(id => {
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
												fetch(`/bookmarks/${bookmark.id}`, {
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

		this.openingContextMenu = true;
		this.contextMenu = new Overlay({
			appendTo: this.elem,
			style: { top: `${y}px`, left: `${x}px` },
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
