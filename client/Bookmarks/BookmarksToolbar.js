import { Button, Search, debounce } from 'vanilla-bean-components';

import state from '../state';

import { Toolbar } from '../Layout';
import BookmarkDialog from './BookmarkDialog';
import CategoryDialog from './CategoryDialog';
import ContextMenu from './ContextMenu';

export default class BookmarksToolbar extends Toolbar {
	async render(options = this.options) {
		super.render(options);

		const debouncedSearch = debounce(options.search);

		this.search = new Search({
			appendTo: this.elem,
			styles: () => `
				width: auto;
				flex: 1;
				margin: 6px;
				height: 2.4rem;
			`,
			value: state.search,
			onKeyUp: ({ key, value }) => {
				debouncedSearch(value);

				if (key === 'Enter') options.search(value);
			},
		});

		setTimeout(() => {
			this.search.value = state.search;
			this.search.elem.focus();
			if (state.search.length > 0) options.search(state.search);
			state.searchElem = this.search.elem;
		}, 100);

		new Button({
			appendTo: this.elem,
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
			onPointerPress: event => {
				event.stop();

				this.contextMenu?.hide();

				this.contextMenu = new ContextMenu({
					appendTo: this.elem,
					x: event?.clientX,
					y: event?.clientY,
					items: [
						{
							textContent: 'Add Bookmark',
							onPointerPress: () => new BookmarkDialog(),
						},
						{
							textContent: 'Add Category',
							onPointerPress: () => new CategoryDialog(),
						},
					],
				});
			},
		});
	}

	setOption(key, value) {
		if (key === 'search') return;
		else super.setOption(key, value);
	}
}
