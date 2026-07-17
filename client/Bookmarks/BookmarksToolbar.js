import { Button, Input, debounce } from '@vanilla-bean/components';

import { getSearchEngines } from '../api';
import context from '../context';

import { Toolbar } from '../Layout';
import BookmarkDialog from './BookmarkDialog';
import CategoryDialog from './CategoryDialog';
import ContextMenu from './ContextMenu';
import SearchEngineDialog from './SearchEngineDialog';
import { fixLink } from './util';

export default class BookmarksToolbar extends Toolbar {
	static schema = {
		// data: the search option collides with the this.search Input created in build()
		search: { data: true },
	};

	build() {
		this.contextMenu = new ContextMenu({ appendTo: this });

		this.search = new Input({
			type: 'search',
			appendTo: this.elem,
			styles: () => `
				width: auto;
				flex: 1;
				margin: 6px;
				height: 2.4rem;
			`,
			value: context.preRenderSearch,
			onKeyDown: ({ key, event }) => {
				if (key === 'Escape') {
					event.preventDefault();
					this.search.elem.blur();
				}
			},
			onKeyUp: debounce(({ key, value }) => {
				if (key === 'Enter') return window.open(fixLink(value));

				this.options.search(value);
			}),
			onSearch: debounce(({ value }) => this.options.search(value)),
		});

		this.search.elem.addEventListener('contextmenu', async event => {
			event.preventDefault();
			event.stopPropagation();

			const engines = (await getSearchEngines()).body;

			this.contextMenu.options.items = Object.values(engines).map(engine => ({
				textContent: engine.label,
				onPointerPress: () => new SearchEngineDialog({ engine }),
			}));

			this.contextMenu.show({ x: event.clientX, y: event.clientY });
		});

		requestAnimationFrame(() => {
			this.search.value = context.preRenderSearch;
			this.search.elem.focus();
			if (context.preRenderSearch.length > 0) this.options.search(context.preRenderSearch);
			context.searchElem = this.search.elem;
		});

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
				event.preventDefault();
				event.stopPropagation();

				this.contextMenu.options.items = [
					{
						textContent: 'Add Bookmark',
						onPointerPress: () => new BookmarkDialog(),
					},
					{
						textContent: 'Add Category',
						onPointerPress: () => new CategoryDialog(),
					},
					{
						textContent: 'Add Search Engine',
						onPointerPress: () => new SearchEngineDialog(),
					},
				];

				this.contextMenu.show({ x: event.clientX, y: event.clientY });
			},
		});
	}
}
