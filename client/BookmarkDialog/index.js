import { ModalDialog, Label, TextInput, Button, IconButton, ColorPicker, storage } from 'vanilla-bean-components';

import state from '../state';

export default class BookmarkDialog extends ModalDialog {
	constructor({ bookmark, ...rest }) {
		const nameInput = new TextInput({ label: 'Name', value: bookmark?.name, validations: [[/.+/, 'Required']] });
		const urlInput = new TextInput({ label: 'URL', value: bookmark?.url, validations: [[/.+/, 'Required']] });
		const colorPicker = new ColorPicker({
			label: 'Color',
			value: bookmark?.color || 'random',
			appendChildren: [
				new Button({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...(JSON.parse(storage.get('recentColors')) || []).map(color => new IconButton({ icon: 'fill-drip', style: { backgroundColor: color }, onPointerPress: () => colorPicker.set(color) })),
			],
		});

		super({
			size: 'large',
			header: `${bookmark ? 'Edit' : 'Create'} Bookmark${bookmark ? ` | ${bookmark.name}` : ''}`,
			content: [new Label({ label: 'Name', appendChild: nameInput }), new Label({ label: 'URL', appendChild: urlInput }), colorPicker.label.elem],
			buttons: ['Save', ...(bookmark ? ['Delete'] : []), 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					const validationErrors = [...nameInput.validate(), ...urlInput.validate()];

					if (validationErrors.length) return;

					const color = colorPicker.value;
					let recentColors = [...new Set([color, ...(JSON.parse(storage.get('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					storage.set('recentColors', JSON.stringify(recentColors));

					fetch(bookmark ? `/bookmarks/${bookmark?.id}` : '/bookmarks', {
						method: bookmark ? 'PUT' : 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: nameInput.elem.value, url: urlInput.elem.value, color }),
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
					fetch(`/bookmarks/${bookmark.id}`, {
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
