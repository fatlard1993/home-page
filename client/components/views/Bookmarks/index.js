import './index.css';

import socketClient from 'socket-client';

import { Toolbar } from '../../layout';
import { IconButton, Search } from '../../inputs';
import View from '../View';
import NoData from '../../NoData';
import Link from '../../Link';
import BookmarkDialog from '../../dialogs/BookmarkDialog';
import DomElem from '../../DomElem';
import { fixLink } from './util';

export class Bookmarks extends View {
	constructor({ className, state: serverState, ...rest }) {
		super();

		this.options = { className, ...rest };

		socketClient.on('state', newState => this.render({ className, serverState: newState, ...rest }));

		socketClient.on('search', ({ suggestions: searchResults }) => this.render({ className, serverState: { ...serverState, searchResults }, ...rest }));

		this.render({ className, serverState, ...rest });
	}

	render({ className, serverState, ...rest }) {
		if (!serverState) {
			socketClient.reply('request_state', true);

			return undefined;
		}

		this.serverState = serverState;

		console.log('render', serverState);

		super.render({ className: ['bookmarks', className], ...rest });

		const appendTo = this.elem;
		const { bookmarkIds, bookmarks, searchResults } = serverState;

		new Toolbar({
			appendTo,
			appendChildren: [
				new Search(),
				new IconButton({
					icon: 'plus',
					className: 'right',
					onPointerPress: () => new BookmarkDialog({ appendTo }),
				}),
			],
		});

		if (!bookmarkIds?.length) {
			new NoData({ appendTo, textContent: 'No bookmarks yet .. Create them with the + button above' });
		} else {
			if (searchResults) {
				new DomElem('div', {
					appendTo,
					className: 'bookmarksContainer search',
					appendChildren: [new DomElem('h2', { textContent: 'Search' }), ...searchResults.map(search => new Link({ textContent: search, href: fixLink(search) }))],
				});
			}

			new DomElem('div', {
				appendTo,
				className: 'bookmarksContainer',
				appendChildren: [
					new DomElem('h2', { textContent: 'Bookmarks' }),
					...bookmarkIds.map(id => {
						const { name: textContent, url: href, color: backgroundColor } = bookmarks[id];

						return new Link({ textContent, href, style: { backgroundColor } });
					}),
				],
			});
		}
	}

	cleanup() {
		socketClient.clearEventListeners();

		if (this?.list?.cleanup) this.list.cleanup();

		super.cleanup();
	}
}
