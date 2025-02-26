import { styled, Menu, isDescendantOf } from 'vanilla-bean-components';

const itemHeight = 37;
const reticleSize = 32;

const Reticle = styled.Component`
	position: absolute;
	color: red;

	--aug-border: initial;
	--aug-all-hexangle-up: initial;
	--aug-all-width: ${reticleSize}px;
	--reticle-color: currentColor;
	--reticle-size: calc(var(--aug-all-width) * 0.25);
	--aug-border-bg: radial-gradient(
			circle at top center,
			var(--reticle-color) var(--reticle-size),
			transparent var(--reticle-size)
		),
		radial-gradient(
			circle at bottom 13.92% right 6.89%,
			var(--reticle-color) var(--reticle-size),
			transparent var(--reticle-size)
		),
		radial-gradient(
			circle at bottom 13.92% left 6.89%,
			var(--reticle-color) var(--reticle-size),
			transparent var(--reticle-size)
		);
	transform-origin: 50% 56%;
	transform: rotateZ(0deg);
	transition:
		transform 0.3s ease-out,
		color 0.4s ease-out;
	background: radial-gradient(circle at 50% 56%, var(--reticle-color) 2px, transparent 2px);

	@starting-style {
		transform: rotateZ(360deg) scale(3);
		color: transparent;
	}
`;

export default class ContextMenu extends styled.Popover(
	() => `
		overflow: visible;
		transform: scaleY(0);
		transition:
			opacity 0.3s,
			transform 0.1s,
			overlay 0.3s allow-discrete,
			display 0.3s allow-discrete;

		&::backdrop {
			background-color: rgb(0 0 0 / 0%);
			transition:
				display 0.7s allow-discrete,
				overlay 0.7s allow-discrete,
				background-color 0.7s;
		}

		&:popover-open {
			opacity: 1;
			transform: scaleY(1);
			transition:
				overlay 0.6s allow-discrete,
				display 0.6s allow-discrete,
				opacity 0.6s,
				transform 0.6s;

			&::backdrop {
				background-color: rgb(0 0 0 / 25%);
			}
		}

		@starting-style {
			&:popover-open {
				opacity: 0;
				transform: scaleY(0);

				&::backdrop {
					background-color: rgb(0 0 0 / 0%);
				}
			}
		}

		ul {
			overflow: hidden;
		}

		li {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`,
	{ autoOpen: false, sticky: false, maxWidth: 240 },
) {
	render() {
		super.render();

		const keyBinds = ({ key }) => {
			if (this.isOpen && key === 'Escape') this.hide();
		};
		const pointerBinds = ({ target }) => {
			if (this.isOpen && !isDescendantOf(target, this.menu.elem)) this.hide();
		};

		document.addEventListener('keyup', keyBinds);
		document.addEventListener('pointerdown', pointerBinds);

		this.addCleanup('contextMenu', () => {
			document.removeEventListener('keyup', keyBinds);
			document.removeEventListener('pointerdown', pointerBinds);
		});
	}

	_setOption(key, value) {
		if (key === 'items') {
			if (!this.menu) this.menu = new Menu({ appendTo: this });

			this.menu.options.items = value.map(item => ({
				...item,
				...(!this.options.sticky && {
					onPointerPress: event => {
						item.onPointerPress(event);

						this.hide();
					},
				}),
			}));

			this.options.maxHeight = (value.length + 1) * itemHeight;
		} else super._setOption(key, value);
	}

	edgeAwarePlacement(options) {
		const { x, y } = options;

		if (this.contextPointer) this.contextPointer.elem.remove();

		this.contextPointer = new Reticle({
			appendTo: document.body,
			attributes: { 'data-augmented-ui': 'all-hexangle-up' },
			style: {
				left: `${x - reticleSize / 2}px`,
				top: `${y - reticleSize / 2}px`,
			},
		});

		return super.edgeAwarePlacement(options);
	}

	hide() {
		if (this.contextPointer) this.contextPointer.elem.remove();

		super.hide();
	}
}
