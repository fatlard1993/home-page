import { ModalDialog, TextInput, Button, IconButton, ColorPicker, storage } from 'vanilla-bean-components';

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

					fetch(category ? `/bookmarks/categories/${category?.id}` : '/bookmarks/categories', {
						method: category ? 'PUT' : 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: nameInput.elem.value, color }),
					})
						.then(response => response.json())
						.then(data => {
							console.log('Success:', data);
							state.router.renderView();
						})
						.catch(error => {
							console.error('Error:', error);
						});
				} else if (button === 'Delete') {
					fetch(`/bookmarks/category/${category.id}`, {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
					})
						.then(response => response.json())
						.then(data => {
							console.log('Success:', data);
							state.router.renderView();
						})
						.catch(error => {
							console.error('Error:', error);
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
