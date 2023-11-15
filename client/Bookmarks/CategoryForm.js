import { Input, ColorPicker, Label, DomElem } from 'vanilla-bean-components';

import { createCategory, updateCategory } from '../api';

export default class CategoryForm extends DomElem {
	async render(options = this.options) {
		super.render(options);

		this.nameInput = new Input({ type: 'text', value: options.category?.name || '', validations: [[/.+/, 'Required']] });

		this.colorPicker = new ColorPicker({
			value: options.category?.color || 'random',
			swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
		});

		this.content([new Label('Name', this.nameInput), new Label('Default Color', this.colorPicker)]);
	}

	save() {
		const validationErrors = [...this.nameInput.validate()];

		if (validationErrors.length > 0) return;

		const color = this.colorPicker.value;
		const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

		recentColors.length = Math.min(recentColors.length, 10);

		localStorage.setItem('recentColors', JSON.stringify(recentColors));

		if (this.options.category) {
			updateCategory(this.options.category.id, { body: { name: this.nameInput.elem.value, color } });
		} else {
			createCategory({ body: { name: this.nameInput.elem.value, color } });
		}
	}
}
