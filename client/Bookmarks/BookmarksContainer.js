import { Card, Link, Button, Elem, SectionLabel, styled } from '@vanilla-bean/components';
import { fixLink } from './util';

export default class BookmarksContainer extends styled(
	Card,
	({ colors, space }) => `
	border-radius: 0;

	.categoryHeader {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: ${space.xs} ${space.sm};
		margin-bottom: ${space.sm};

		.categoryName {
			margin: 0;
		}
	}

	.categoryName {
		pointer-events: none;
	}

	&.batchEdit .categoryName {
		pointer-events: auto;
		cursor: grab;
	}

	&.categoryMarked {
		opacity: 0.5;
		filter: grayscale(70%);
		outline: 3px solid ${colors.danger};
		outline-offset: -3px;
	}

	&.categoryMarked .categoryName {
		text-decoration: line-through;
		text-decoration-thickness: 3px;
		text-decoration-color: ${colors.danger};
	}

	&.dragOverCategory {
		outline: 3px dashed ${colors.orange};
		outline-offset: 3px;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: ${space.sm};

		a, button {
			max-width: 100%;
			overflow: hidden;

			img {
				width: 16px;
				height: 16px;
				vertical-align: middle;
				margin-right: ${space.xs};
				pointer-events: none;
			}
		}

		[draggable='true'] {
			cursor: grab;
		}

		/* Marked for deletion: pressed's selected fill loses to the bookmark's own color, so it's drawn here too */
		[aria-pressed='true'] {
			opacity: 0.5;
			filter: grayscale(70%);
			text-decoration: line-through;
			text-decoration-thickness: 3px;
			text-decoration-color: ${colors.danger};
			outline: 3px solid ${colors.danger};
			outline-offset: 2px;
		}
	}
`,
) {
	_buildBookmark({ name, url, favicon, markedForDeletion, order, category, deleted, color, ...options }) {
		const shared = {
			// A search result has no id, and no attribute to say so
			...(options.id && { 'data-bookmark-id': options.id }),
			styles: ({ colors }) => ({
				background: color || colors.blue,
				color: colors.mostReadable(color || colors.blue, [colors.white, colors.black]),
			}),
			...(favicon
				? {
						append: [
							new Elem({
								tag: 'img',
								src: `/bookmarks/${options.id}/favicon`,
								// A favicon that won't load leaves the name standing alone, not a broken-image glyph.
								onerror: event => event.target.remove(),
							}),
							name,
						],
					}
				: { textContent: name }),
			...options,
		};

		if (this.options.batchEdit) {
			const button = new Button({
				...shared,
				draggable: true,
				variant: 'raised',
				pressed: !!markedForDeletion,
				onPointerPress: () => this.options.onTapBookmark?.(options.id),
			});

			if (options.id) this._bookmarkButtons[options.id] = button;

			return button;
		}

		return new Link({ href: fixLink(url), variant: 'raised', draggable: false, ...shared });
	}

	/**
	 * Show a batch-mode bookmark marked for deletion, or not, in place: rebuilding the row would drop its focus.
	 * @param {string} id - The bookmark's id
	 * @param {boolean} marked - Whether it is marked
	 */
	markBookmark(id, marked) {
		const button = this._bookmarkButtons[id];

		if (button) button.options.pressed = marked;
	}

	/** The batch-mode button beside the name: in delete mode a toggle marking the category, in paint mode a press painting it. */
	_renderCategoryButton() {
		if (!this._categoryButton) return;

		const { label, batchMode, categoryMarkedForDeletion } = this.options;
		const painting = batchMode === 'paint';

		this._categoryButton.setOptions({
			textContent: `${painting ? 'Paint' : 'Mark'} ${label ?? ''}`.trim(),
			icon: painting ? 'paintbrush' : 'trash-can',
			pressed: painting ? undefined : !!categoryMarkedForDeletion,
		});
	}

	static schema = {
		label: {
			set(value) {
				this._labelText.elem.textContent = value;
				this._renderCategoryButton();
			},
		},
		bookmarks: {
			set(value) {
				this._bookmarkButtons = {};
				this.linkContainer.content(value.map(bookmark => this._buildBookmark(bookmark)));
			},
		},
		categoryId: {
			set(value) {
				this.setAttributes({ 'data-category-id': value || '' });
			},
		},
		batchEdit: {
			set(value) {
				this[value ? 'addClass' : 'removeClass']('batchEdit');
				if (this._labelText) this._labelText.elem.draggable = !!(value && this.options.categoryId);
			},
		},
		categoryMarkedForDeletion: {
			set(value) {
				this[value ? 'addClass' : 'removeClass']('categoryMarked');
				this._renderCategoryButton();
			},
		},
		// The batch bar's mode, 'delete' or 'paint': what the category's button does
		batchMode: {
			set() {
				this._renderCategoryButton();
			},
		},
		onTapBookmark: {},
		onTapCategory: {},
	};

	build() {
		// Outside batch mode the heading is inert (pointer-events: none via CSS); in batch mode it stays a plain
		// heading, dragged to reorder, and a button beside it marks or paints the category.
		const header = new Elem({ addClass: 'categoryHeader', appendTo: this });

		this._labelText = new SectionLabel({ addClass: 'categoryName', appendTo: header });

		if (this.options.batchEdit && this.options.categoryId) {
			this._categoryButton = new Button({
				appendTo: header,
				variant: 'flat',
				size: 'small',
				onPointerPress: event => {
					event.stopPropagation();

					this.options.onTapCategory?.(this.options.categoryId);
				},
			});
			this._renderCategoryButton();
		}

		this.linkContainer = new Elem({ addClass: 'links', appendTo: this });
	}
}
