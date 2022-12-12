import { ModalDialog, TextInput, Button, IconButton, ColorPicker, Select, storage } from 'vanilla-bean-components';
import { createBookmark, deleteBookmark, updateBookmark } from '../services';

import state from '../state';

export default class BookmarkDialog extends ModalDialog {
	constructor({ bookmark, ...rest }) {
		const nameInput = new TextInput({ label: 'Name', value: bookmark?.name, validations: [[/.+/, 'Required']] });
		const urlInput = new TextInput({ label: 'URL', value: bookmark?.url, validations: [[/.+/, 'Required']] });
		const newCategoryInput = new TextInput({
			label: { label: 'New Category', style: { display: 'none' } },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
		});
		const categorySelect = new Select({
			label: 'Category',
			options: ['Default', 'New', ...Object.keys(state.serverState.categories).map(id => ({ label: state.serverState.categories[id].name, value: id }))],
			value: bookmark?.category || 'Default',
			onChange: ({ value }) => (newCategoryInput.label.elem.style.display = value === 'New' ? 'block' : 'none'),
		});
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
			content: [nameInput.label.elem, urlInput.label.elem, categorySelect.label.elem, newCategoryInput.label.elem, colorPicker.label.elem],
			buttons: ['Save', ...(bookmark ? ['Delete'] : []), 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					const validationErrors = [...nameInput.validate(), ...urlInput.validate(), ...(categorySelect.value === 'New' ? newCategoryInput.validate() : [])];

					if (validationErrors.length) return;

					const color = colorPicker.value;
					let recentColors = [...new Set([color, ...(JSON.parse(storage.get('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					storage.set('recentColors', JSON.stringify(recentColors));

					let category = categorySelect.value;

					if (category === 'Default') category = '';
					else if (category === 'New') category = newCategoryInput.value;

					if (bookmark) {
						updateBookmark(bookmark.id, { body: { name: nameInput.elem.value, url: urlInput.elem.value, category, color } }).then(data => {
							console.log('Success:', data);
							state.router.renderView();
						});
					} else {
						createBookmark({ body: { name: nameInput.elem.value, url: urlInput.elem.value, category, color } }).then(data => {
							console.log('Success:', data);
							state.router.renderView();
						});
					}
				} else if (button === 'Delete') {
					deleteBookmark(bookmark.id).then(data => {
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
