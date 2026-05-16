import { Dialog, conditionalList } from 'vanilla-bean-components';

import { createCategory, updateCategory } from '../../api';
import { saveRecentColor } from '../util';

import DeleteCategoryDialog from '../DeleteCategoryDialog';
import CategoryForm from './CategoryForm';

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

					const { color } = this.form.options.data;

					saveRecentColor(color);

					if (isEdit) {
						updateCategory(this.options.category.id, { body: this.form.options.data });
					} else {
						createCategory({ body: this.form.options.data });
					}
				} else if (button === 'Delete') {
					new DeleteCategoryDialog({ category: this.options.category });
				}

				this.close();
			},
			...options,
		});

		this.form = new CategoryForm({ appendTo: this._body, category: this.options.category });
	}
}
