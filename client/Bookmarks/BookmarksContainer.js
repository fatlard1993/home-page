import { Card, Link, Button, Elem, styled } from '@vanilla-bean/components';
import { fixLink } from './util';

export default class BookmarksContainer extends styled(
	Card,
	({ colors, space }) => `
	margin: 0 0 2px;
	border-radius: 0;

	.categoryName {
		display: block;
		margin-bottom: ${space.sm};
		font-weight: 600;
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

		.markedForDeletion {
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
			'data-bookmark-id': options.id,
			addClass: markedForDeletion ? ['markedForDeletion'] : [],
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
			return new Button({
				...shared,
				draggable: true,
				variant: 'raised',
				onPointerPress: () => this.options.onTapBookmark?.(options.id),
			});
		}

		return new Link({ href: fixLink(url), variant: 'raised', draggable: false, ...shared });
	}

	static schema = {
		label: {
			set(value) {
				this._labelText.elem.textContent = value;
			},
		},
		bookmarks: {
			set(value) {
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
			},
		},
		onTapBookmark: {},
		onTapCategory: {},
	};

	build() {
		this._labelText = new Elem({ tag: 'label', addClass: 'categoryName', appendTo: this });
		this.linkContainer = new Elem({ addClass: 'links', appendTo: this });

		// Same construction-time split as the bookmarks: outside batch mode the label is inert
		// (pointer-events: none via CSS), so the toggle listener only exists in batch mode.
		if (this.options.batchEdit && this.options.categoryId) {
			this._labelText.elem.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();

				this.options.onTapCategory?.(this.options.categoryId);
			});
		}
	}
}
