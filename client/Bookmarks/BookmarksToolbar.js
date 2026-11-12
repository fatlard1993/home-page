import { Button, ContextMenu, Input, Notify, Toolbar, debounce, failureReason } from '@vanilla-bean/components';

import { getSearchEngines } from '../api';
import context from '../context';

import BookmarkDialog from './BookmarkDialog';
import CategoryDialog from './CategoryDialog';
import SearchEngineDialog from './SearchEngineDialog';
import { fixLink } from './util';

export default class BookmarksToolbar extends Toolbar {
	static schema = {
		// The view's header: a top bar, then the Content below it
		variant: { default: 'bar' },
		// One line: the search field takes the room the buttons leave
		wrap: { default: false },
		// data: the search option collides with the this.search Input created in build()
		search: { data: true },
	};

	build() {
		this.contextMenu = new ContextMenu({ appendTo: this });

		// Spaces around a term are typing, not searching: the engines would be asked for a blank term
		const handOn = value => this.options.search(value.trim());

		this.search = new Input({
			type: 'search',
			appendTo: this.elem,
			'aria-label': 'Search',
			styles: () => `
				width: auto;
				flex: 1;
			`,
			value: context.preRenderSearch,
			// The handler receives the keyboard event itself; there is no wrapper carrying an `event` field
			onKeyDown: event => {
				if (event.key === 'Escape') {
					event.preventDefault();
					this.search.elem.blur();
				}
			},
			onKeyUp: debounce(({ key, value }) => {
				const term = value.trim();

				// Enter opens what was typed; with nothing typed, or only spaces, there is nothing to open
				if (key === 'Enter') return term && window.open(fixLink(term));

				this.options.search(term);
			}),
			onSearch: debounce(({ value }) => handOn(value)),
		});

		this.search.elem.addEventListener('contextmenu', async event => {
			event.preventDefault();
			event.stopPropagation();

			const engines = await getSearchEngines();
			const refused = failureReason(engines);

			if (refused) {
				new Notify({ intent: 'danger', content: `Could not load the search engines: ${refused}` });

				return;
			}

			this.contextMenu.options.items = Object.values(engines.body).map(engine => ({
				textContent: engine.label,
				onPointerPress: () => new SearchEngineDialog({ engine }),
			}));

			this.contextMenu.open({ x: event.clientX, y: event.clientY });
		});

		requestAnimationFrame(() => {
			this.search.value = context.preRenderSearch;
			this.search.elem.focus();
			if (context.preRenderSearch.trim()) handOn(context.preRenderSearch);
			context.searchElem = this.search.elem;
		});

		new Button({
			appendTo: this.elem,
			icon: 'plus',
			title: 'Add',
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

				this.contextMenu.open({ x: event.clientX, y: event.clientY });
			},
		});
	}
}
