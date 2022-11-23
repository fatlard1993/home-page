import './index.css';

import { mostReadable } from '@ctrl/tinycolor';

import { DomElem, View, IconButton, NoData, Link, Search } from 'vanilla-bean-components';

import { Content, Toolbar } from '../layout';
import BookmarkDialog from '../BookmarkDialog';
import { fixLink } from './util';

export class Bookmarks extends View {
	constructor(options) {
		console.log('new Bookmarks', options);
		super(options);
	}

	render({ serverState, ...options } = this.options) {
		console.log('Bookmarks render', { serverState, ...options });

		if (!serverState) {
			fetch('/bookmarks')
				.then(response => response.json())
				.then(data => this.render({ ...options, serverState: data }));

			return undefined;
		}

		this.serverState = serverState;

		console.log('render', serverState);

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
					className: 'right',
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
						const { name: textContent, url: href, color: backgroundColor } = bookmarks[id];

						return new Link({ textContent, href, style: { backgroundColor, color: mostReadable(backgroundColor, ['hsl(0, 0%, 10%)', 'hsl(0, 0%, 90%)']) } });
					}),
				],
			});
		}
	}

	cleanup() {
		if (this.list?.cleanup) this.list.cleanup();

		super.cleanup();
	}
}
