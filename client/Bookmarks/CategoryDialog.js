import { ModalDialog, TextInput, Button, IconButton, ColorPicker, storage } from 'vanilla-bean-components';
import { createCategory, deleteCategory, updateCategory } from '../services';

import state from '../state';

export default class CategoryDialog extends ModalDialog {
	constructor({ category, ...rest }) {
		const nameInput = new TextInput({ label: 'Name', value: category?.name, validations: [[/.+/, 'Required']] });

		const colorPicker = new ColorPicker({
			label: 'Color',
			value: category?.color || 'random',
			appendChildren: [
				new Button({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...(JSON.parse(storage.get('recentColors')) || []).map(color => new IconButton({ icon: 'fill-drip', style: { backgroundColor: color }, onPointerPress: () => colorPicker.set(color) })),
			],
		});

		super({
			size: 'large',
			header: `${category ? 'Edit' : 'Create'} Category${category ? ` | ${category.name}` : ''}`,
			content: [nameInput.label.elem, colorPicker.label.elem],
			buttons: ['Save', ...(category ? ['Delete'] : []), 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					const validationErrors = [...nameInput.validate()];

					if (validationErrors.length) return;

					const color = colorPicker.value;
					let recentColors = [...new Set([color, ...(JSON.parse(storage.get('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					storage.set('recentColors', JSON.stringify(recentColors));

					if (category) {
						updateCategory(category.id, { body: { name: nameInput.elem.value, color } }).then(data => {
							console.log('Success:', data);
							state.router.renderView();
						});
					} else {
						createCategory({ body: { name: nameInput.elem.value, color } }).then(data => {
							console.log('Success:', data);
							state.router.renderView();
						});
					}
				} else if (button === 'Delete') {
					deleteCategory(category.id).then(data => {
						console.log('Success:', data);
						state.router.renderView();
					});
				}

				closeDialog();
			},
			...rest,
		});

		document.addEventListener('keyup', ({ key }) => {
			if (key === 'Escape') this.modal.remove();
		});
	}
}
