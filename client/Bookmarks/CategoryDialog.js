import { Dialog, conditionalList } from 'vanilla-bean-components';
import { deleteCategory } from '../api';
import CategoryForm from './CategoryForm';

export default class CategoryDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'large',
			header: `${options.category ? 'Edit' : 'Create'} Category${options.category ? ` | ${options.category.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: options.category, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') this.form.save();
				else if (button === 'Delete') {
					deleteCategory(this.options.category.id);
				}

				this.close();
			},
			...options,
		});
	}

	async render(options = this.options) {
		super.render(options);

		this.form = new CategoryForm({ appendTo: this._body, category: this.options.category });
	}
}
