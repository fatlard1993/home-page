import './index.css';

import { mostReadable } from '@ctrl/tinycolor';

import { DomElem, View, IconButton, NoData, Link, Search, Overlay, Menu } from 'vanilla-bean-components';

import { Content, Toolbar } from '../layout';
import BookmarkDialog from '../BookmarkDialog';
import { fixLink } from './util';
import state from '../state';

export class Bookmarks extends View {
	constructor(options) {
		super({
			onContextMenu: evt => {
				evt.stop();

				console.log('page', evt, this);

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

	render({ serverState, ...options } = this.options) {
		if (!serverState) {
			fetch('/bookmarks')
				.then(response => response.json())
				.then(data => this.render({ ...options, serverState: data }));

			return undefined;
		}

		this.serverState = serverState;

		super.render(options);

		const appendTo = this.elem;
		const { bookmarkIds, bookmarks, searchResults } = serverState;

		const search = new Search({
			onKeyUp: ({ key }) => {
				// todo debounced search

				if (key === 'Enter') {
					// todo search
					fetch(`/search/${search.elem.value}`)
						.then(response => response.json())
						.then(({ suggestions }) => this.render({ ...options, serverState: { ...serverState, searchResults: suggestions } }));
				}
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

		const content = new Content({ appendTo });

		if (!bookmarkIds?.length) {
			new NoData({ appendTo: content, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults) {
				new DomElem({
					appendTo: content,
					className: 'bookmarksContainer search',
					appendChildren: [new DomElem('h2', { textContent: 'Search' }), ...searchResults.map(search => new Link({ textContent: search, href: fixLink(search) }))],
				});
			}

			new DomElem({
				appendTo: content,
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

								console.log('link', evt, this);

								this.showContextMenu({
									x: evt.clientX,
									y: evt.clientY,
									items: [
										{
											textContent: `Edit ${textContent}`,
											onPointerPress: () => new BookmarkDialog({ appendTo, bookmark }),
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

	cleanup() {
		if (this.list?.cleanup) this.list.cleanup();

		super.cleanup();
	}
}
