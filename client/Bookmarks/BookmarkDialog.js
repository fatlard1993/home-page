import { Dialog, TextInput, Button, IconButton, ColorPicker, Select } from 'vanilla-bean-components';
import { createBookmark, deleteBookmark, updateBookmark } from '../services';

import state from '../state';

export default class BookmarkDialog extends Dialog {
	constructor({ bookmark, category = {}, ...options }) {
		const nameInput = new TextInput({ label: 'Name', value: bookmark?.name || '', validations: [[/.+/, 'Required']] });
		const urlInput = new TextInput({ label: 'URL', value: bookmark?.url || '', validations: [[/.+/, 'Required']] });
		const newCategoryInput = new TextInput({
			label: 'New Category',
			labelOptions: { style: { display: 'none' } },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
		});
		const categorySelect = new Select({
			label: 'Category',
			options: ['Default', 'New', ...Object.keys(state.serverState?.categories || {}).map(id => ({ label: state.serverState?.categories?.[id]?.name, value: id }))],
			value: bookmark?.category || category.id || 'Default',
			onChange: ({ value }) => (newCategoryInput._label.elem.style.display = value === 'New' ? 'block' : 'none'),
		});
		const colorPicker = new ColorPicker({
			label: 'Color',
			value: bookmark?.color || 'random',
			appendChildren: [
				new Button({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...(JSON.parse(localStorage.getItem('recentColors')) || []).map(
					backgroundColor =>
						new IconButton({
							icon: 'fill-drip',
							styles: ({ colors }) => `
								background: ${backgroundColor};
								color: ${colors.mostReadable(backgroundColor, [colors.white, colors.black])}
							`,
							onPointerPress: () => colorPicker.set(backgroundColor),
						}),
				),
			],
		});

		super({
			size: 'large',
			header: `${bookmark ? 'Edit' : 'Create'} Bookmark${bookmark ? ` | ${bookmark.name}` : ''}`,
			content: [nameInput, urlInput, categorySelect, newCategoryInput, colorPicker],
			buttons: ['Save', ...(bookmark ? ['Delete'] : []), 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					const validationErrors = [...nameInput.validate(), ...urlInput.validate(), ...(categorySelect.value === 'New' ? newCategoryInput.validate() : [])];

					if (validationErrors.length > 0) return;

					const color = colorPicker.value;
					const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					localStorage.setItem('recentColors', JSON.stringify(recentColors));

					let category = categorySelect.value;

					if (category === 'Default') category = '';
					else if (category === 'New') category = newCategoryInput.value;

					if (bookmark) {
						updateBookmark(bookmark.id, { body: { name: nameInput.elem.value, url: urlInput.elem.value, category, color } }).then(() => {
							state.router?.renderView();
						});
					} else {
						createBookmark({ body: { name: nameInput.elem.value, url: urlInput.elem.value, category, color } }).then(() => {
							state.router?.renderView();
						});
					}
				} else if (button === 'Delete') {
					deleteBookmark(bookmark.id).then(() => {
						state.router?.renderView();
					});
				}

				closeDialog();
			},
			...options,
		});
	}
}
