import { Button, Search, debounceCallback } from 'vanilla-bean-components';

import { Toolbar } from '../Layout';
import BookmarkDialog from './BookmarkDialog';

export default class BookmarksToolbar extends Toolbar {
	constructor({ search, ...options }) {
		super({
			append: [
				new Search({
					styles: () => `
						width: auto;
						flex: 1;
						margin: 6px;
						height: 2.4rem;
					`,
					onKeyUp: ({ key, value }) => {
						debounceCallback(() => search(value), 700);

						if (key === 'Enter') search(value);
					},
				}),
				new Button({
					styles: () => `
						&:empty {
							padding: 0;
							margin: 6px;
							font-size: 1.3em;
							height: 2.4rem;
							width: 2.4rem;
						}
					`,
					icon: 'plus',
					onPointerPress: () => new BookmarkDialog({ appendTo: document.body }),
				}),
			],
			...options,
		});
	}
}
