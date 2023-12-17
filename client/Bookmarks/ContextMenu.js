import { Popover, Menu } from 'vanilla-bean-components';

export default class ContextMenu extends Popover {
	constructor(options) {
		const itemHeight = 37;

		const { items = [], sticky = false, maxWidth = 240, maxHeight = items.length * itemHeight } = options;

		super({
			maxWidth,
			maxHeight,
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

							this.elem.remove();
						},
					}),
				})),
			}),
			...options,
		});
	}
}
