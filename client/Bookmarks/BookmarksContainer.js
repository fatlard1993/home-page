import { Link, Button, Elem, styled } from '@vanilla-bean/components';
import { fixLink } from './util';

export default class BookmarksContainer extends styled.Label(
	({ colors }) => `
	margin: 1px 0;
	padding: 3px 12px 6px 12px;

	label {
		font-weight: bold;
		pointer-events: none;
	}

	&.batchEdit label {
		pointer-events: auto;
		cursor: grab;
	}

	&.categoryMarked {
		opacity: 0.5;
		filter: grayscale(70%);
		outline: 3px solid ${colors.red};
		outline-offset: -3px;
	}

	&.categoryMarked label {
		text-decoration: line-through;
		text-decoration-thickness: 3px;
		text-decoration-color: ${colors.red};
	}

	&.dragOverCategory {
		outline: 3px dashed ${colors.orange};
		outline-offset: 3px;
	}

	div {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-left: 6px;

		a, button {
			max-width: 100%;
			overflow: hidden;

			img {
				width: 16px;
				height: 16px;
				vertical-align: middle;
				margin-right: 4px;
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
			text-decoration-color: ${colors.red};
			outline: 3px solid ${colors.red};
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
				? { append: [new Elem({ tag: 'img', src: `/bookmarks/${options.id}/favicon` }), name] }
				: { textContent: name }),
			...options,
		};

		if (this.options.batchEdit) {
			return new Button({
				...shared,
				draggable: true,
				// Toggle on click, not pointerdown: pointerdown also fires when starting a drag,
				// and a completed drag never emits a click.
				registeredEvents: new Set(['click']),
				onClick: () => this.options.onToggleBookmark?.(options.id),
			});
		}

		return new Link({ href: fixLink(url), variant: 'button', draggable: false, ...shared });
	}

	static handlers = {
		bookmarks(value) {
			if (!this.linkContainer) this.linkContainer = new Elem({ appendTo: this });

			this.linkContainer.content(value.map(bookmark => this._buildBookmark(bookmark)));
		},
		categoryId(value) {
			this.setAttributes({ 'data-category-id': value || '' });
		},
		batchEdit(value) {
			this[value ? 'addClass' : 'removeClass']('batchEdit');
			if (this._labelText) this._labelText.elem.draggable = !!(value && this.options.categoryId);
		},
		categoryMarkedForDeletion(value) {
			this[value ? 'addClass' : 'removeClass']('categoryMarked');
		},
		onToggleBookmark() {},
		onToggleCategory() {},
	};

	build() {
		super.build();

		// Same construction-time split as the bookmarks: outside batch mode the label is inert
		// (pointer-events: none via CSS), so the toggle listener only exists in batch mode.
		if (this.options.batchEdit && this.options.categoryId) {
			this._labelText.elem.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();

				this.options.onToggleCategory?.(this.options.categoryId);
			});
		}
	}
}
