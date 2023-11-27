import { Dialog, ColorPicker, Form, conditionalList } from 'vanilla-bean-components';

import { createCategory, updateCategory, deleteCategory } from '../api';

export default class CategoryDialog extends Dialog {
	constructor(options = {}) {
		const isEdit = !!options.category?.id;

		super({
			size: 'large',
			header: `${isEdit ? 'Edit' : 'Create'} Category${isEdit ? ` | ${options.category.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: isEdit, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') {
					if (this.form.validate()) return;

					const { color } = this.form.data;

					const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					localStorage.setItem('recentColors', JSON.stringify(recentColors));

					if (isEdit) {
						updateCategory(this.options.category.id, { body: this.form.data });
					} else {
						createCategory({ body: this.form.data });
					}
				} else if (button === 'Delete') {
					deleteCategory(this.options.category.id);
				}

				this.close();
			},
			...options,
		});
	}

	async render(options = this.options) {
		super.render(options);

		const { category } = options;

		this.form = new Form({
			appendTo: this._body,
			data: { name: '', color: 'random', ...category },
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{ key: 'color', label: 'Default Color', Component: ColorPicker, swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])] },
			],
		});
	}
}
