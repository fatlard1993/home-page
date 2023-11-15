import { Button, Search, debounce } from 'vanilla-bean-components';

import context from '../context';

import { Toolbar } from '../Layout';
import BookmarkDialog from './BookmarkDialog';
import CategoryDialog from './CategoryDialog';
import ContextMenu from './ContextMenu';
import { fixLink } from './util';

export default class BookmarksToolbar extends Toolbar {
	async render(options = this.options) {
		super.render(options);

		this.search = new Search({
			appendTo: this.elem,
			styles: () => `
				width: auto;
				flex: 1;
				margin: 6px;
				height: 2.4rem;
			`,
			value: context.preRenderSearch,
			onKeyUp: debounce(({ key, value }) => {
				if (key === 'Enter') return window.open(fixLink(value));

				options.search(value);
			}),
		});

		setTimeout(() => {
			this.search.value = context.preRenderSearch;
			this.search.elem.focus();
			if (context.preRenderSearch.length > 0) options.search(context.preRenderSearch);
			context.searchElem = this.search.elem;
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
