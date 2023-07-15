import { Dialog, TextInput, Button, IconButton, ColorPicker, conditionalList } from 'vanilla-bean-components';
import { createCategory, deleteCategory, updateCategory } from '../services';

import state from '../state';

export default class CategoryDialog extends Dialog {
	constructor({ category, ...rest }) {
		const nameInput = new TextInput({ label: 'Name', value: category?.name || '', validations: [[/.+/, 'Required']] });

		const colorPicker = new ColorPicker({
			label: 'Color',
			value: category?.color || 'random',
			append: [
				new Button({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...(JSON.parse(localStorage.getItem('recentColors')) || []).map(
					color => new IconButton({ icon: 'fill-drip', style: { backgroundColor: color }, onPointerPress: () => colorPicker.set(color) }),
				),
			],
		});

		super({
			size: 'large',
			header: `${category ? 'Edit' : 'Create'} Category${category ? ` | ${category.name}` : ''}`,
			content: [nameInput, colorPicker],
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: category, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					const validationErrors = [...nameInput.validate()];

					if (validationErrors.length > 0) return;

					const color = colorPicker.value;
					const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					localStorage.setItem('recentColors', JSON.stringify(recentColors));

					if (category) {
						updateCategory(category.id, { body: { name: nameInput.elem.value, color } }).then(() => {
							state.router.renderView();
						});
					} else {
						createCategory({ body: { name: nameInput.elem.value, color } }).then(() => {
							state.router.renderView();
						});
					}
				} else if (button === 'Delete') {
					deleteCategory(category.id).then(() => {
						state.router.renderView();
					});
				}

				closeDialog();
			},
			...rest,
		});
	}
}
