import { Dialog, Input, Button, ColorPicker, Label, conditionalList, styled } from 'vanilla-bean-components';
import { createCategory, deleteCategory, updateCategory } from '../api';

import state from '../state';

const ColorPickerButton = styled(
	Button,
	() => `
		margin-top: 12px;
	`,
);

export default class CategoryDialog extends Dialog {
	constructor({ category, ...options } = {}) {
		const nameInput = new Input({ type: 'text', value: category?.name || '', validations: [[/.+/, 'Required']] });

		const colorPicker = new ColorPicker({
			value: category?.color || 'random',
			append: [
				new ColorPickerButton({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...(JSON.parse(localStorage.getItem('recentColors')) || []).map(
					color => new ColorPickerButton({ icon: 'fill-drip', style: { backgroundColor: color }, onPointerPress: () => colorPicker.set(color) }),
				),
			],
		});

		super({
			size: 'large',
			header: `${category ? 'Edit' : 'Create'} Category${category ? ` | ${category.name}` : ''}`,
			body: [new Label('Name', nameInput), new Label('Color', colorPicker)],
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: category, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
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

				this.close();
			},
			...options,
		});
	}
}
