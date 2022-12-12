import { IconButton, Search, debounceCb } from 'vanilla-bean-components';

import { Toolbar } from '../layout';
import BookmarkDialog from './BookmarkDialog';

export default class BookmarksToolbar extends Toolbar {
	constructor({ search, ...options }) {
		super({
			appendChildren: [
				new Search({
					styles: () => `
						width: auto;
						flex: 1;
						margin: 6px;
						height: 2.4rem;
					`,
					onKeyUp: ({ key, target: { value } }) => {
						debounceCb(() => search(value), 700);

						if (key === 'Enter') search(value);
					},
				}),
				new IconButton({
					styles: () => `
						padding: 0;
						margin: 6px;
						font-size: 1.3em;
						height: 2.4rem;
						width: 2.4rem;
					`,
					icon: 'plus',
					onPointerPress: () => new BookmarkDialog({ appendTo: this.elem }),
				}),
			],
			...options,
		});
	}
}