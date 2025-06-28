import { Dialog, Select, Input, Label } from 'vanilla-bean-components';

import { getCategories, deleteCategory } from '../api';

export default class DeleteCategoryDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: `Delete ${options.category.name}?`,
			buttons: ['Delete', 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Delete') {
					deleteCategory(
						options.category.id,
						this.options.keepBookmarks
							? { searchParameters: { moveTo: moveTo.value === 'undefined' ? '' : moveTo.value } }
							: {},
					);
				}

				closeDialog();
			},
			...options,
		});
	}

	async render() {
		const categories = (await getCategories()).body;

		this.options.onDisconnected = () => {
			categories.unsubscribe();
		};

		const moveTo = new Select({
			options: [
				{ label: 'Default', value: undefined },
				...Object.keys(categories).map(id => ({
					label: categories?.[id]?.name,
					value: id,
				})),
			],
			value: undefined,
		});

		const checkbox = new Input({
			type: 'checkbox',
			name: 'Keep bookmarks',
			value: true,
			onChange: ({ value }) => {
				checkbox.options.value = this.options.keepBookmarks = value;
				moveTo.parent.elem.style.display = value ? 'block' : 'none';
			},
		});

		this.options.body = [new Label('Keep Bookmarks?', checkbox), new Label('Move To', moveTo)];

		super.render();
	}
}
