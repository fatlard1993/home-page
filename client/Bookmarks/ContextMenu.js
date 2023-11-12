import { Overlay, Menu } from 'vanilla-bean-components';

export default class ContextMenu extends Overlay {
	constructor(options) {
		const { x, y, items = [], sticky = false, maxWidth = 240 } = options;

		const itemHeight = 36;
		const pastRight = x + maxWidth >= document.body.clientWidth;
		const pastBottom = y + items.length * itemHeight >= document.body.clientHeight;

		super({
			styles: () => `
				max-width: ${maxWidth}px;
				top: ${pastBottom ? 'unset' : `${y}px`};
				bottom: ${pastBottom ? `${document.body.clientHeight - y}px` : 'unset'};
				left: ${pastRight ? 'unset' : `${x}px`};
				right: ${pastRight ? `${document.body.clientWidth - x}px` : 'unset'};
			`,
			append: new Menu({
				styles: () => `
					li {
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				`,
				items: items.map(item => ({
					...item,
					...(!sticky && {
						onPointerPress: event => {
							item.onPointerPress(event);

							this.hide();
						},
					}),
				})),
			}),
			...options,
		});
	}

	hide() {
		this.elem?.remove();
	}
}
