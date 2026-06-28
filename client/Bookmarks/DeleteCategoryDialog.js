import { Dialog, Select, Input, Label } from '@vanilla-bean/components';

import { getCategories, deleteCategory } from '../api';

export default class DeleteCategoryDialog extends Dialog {
	constructor(options = {}) {
		options.keepBookmarks = options.keepBookmarks ?? true;

		super({
			size: 'standard',
			header: `Delete ${options.category.name}?`,
			buttons: ['Delete', 'Cancel'],
			...options,
		});
	}

	async render() {
		const categoriesResponse = await getCategories();
		const categories = categoriesResponse.body;

		this.options.onDisconnected = () => {
			categoriesResponse.unsubscribe();
		};

		const moveTo = new Select({
			options: [
				{ label: 'Default', value: '' },
				...Object.keys(categories).map(id => ({
					label: categories?.[id]?.name,
					value: id,
				})),
			],
			value: '',
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

		this.options.onButtonPress = ({ button, closeDialog }) => {
			if (button === 'Delete') {
				deleteCategory(
					this.options.category.id,
					this.options.keepBookmarks ? { searchParameters: { moveTo: moveTo.value } } : {},
				);
			}

			closeDialog();
		};

		this.options.body = [new Label('Keep Bookmarks?', checkbox), new Label('Move To', moveTo)];

		super.render();
	}
}
