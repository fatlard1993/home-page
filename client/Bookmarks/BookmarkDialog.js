import { Dialog, Input, Button, ColorPicker, Select, Label, conditionalList, styled } from 'vanilla-bean-components';
import { createBookmark, deleteBookmark, updateBookmark } from '../api';

import state from '../state';

const ColorPickerButton = styled(
	Button,
	() => `
		margin-top: 12px;
	`,
);

export default class BookmarkDialog extends Dialog {
	constructor({ bookmark, category = {}, ...options }) {
		const nameInput = new Input({ type: 'text', value: bookmark?.name || '', validations: [[/.+/, 'Required']] });
		const urlInput = new Input({ type: 'text', value: bookmark?.url || '', validations: [[/.+/, 'Required']] });
		const newCategoryInput = new Input({
			type: 'text',
			style: { display: 'none' },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
		});
		const categorySelect = new Select({
			options: ['Default', 'New', ...Object.keys(state.serverState?.categories || {}).map(id => ({ label: state.serverState?.categories?.[id]?.name, value: id }))],
			value: bookmark?.category || category.id || 'Default',
			onChange: ({ value }) => (newCategoryInput.elem.style.display = value === 'New' ? 'block' : 'none'),
		});
		const colorPicker = new ColorPicker({
			value: bookmark?.color || 'random',
			append: [
				new ColorPickerButton({
					icon: 'fill-drip',
					styles: ({ colors }) => `
						animation: rainbow 2s linear;
						animation-iteration-count: infinite;
						color: ${colors.black};

						@keyframes rainbow {
							100%,0%{
								background-color: ${colors.light(colors.red)};
							}
							12%{
								background-color: ${colors.light(colors.orange)};
							}
							25%{
								background-color: ${colors.light(colors.yellow)};
							}
							37%{
								background-color: ${colors.light(colors.green)};
							}
							50%{
								background-color: ${colors.light(colors.teal)};
							}
							62%{
								background-color: ${colors.light(colors.blue)};
							}
							75%{
								background-color: ${colors.light(colors.purple)};
							}
							87%{
								background-color: ${colors.light(colors.pink)};
							}
						}
					`,
					onPointerPress: () => colorPicker.set('random'),
				}),
				...(JSON.parse(localStorage.getItem('recentColors')) || []).map(
					backgroundColor =>
						new ColorPickerButton({
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
			body: [new Label('Name', nameInput), new Label('Url', urlInput), new Label('Category', categorySelect, newCategoryInput), new Label('Color', colorPicker)],
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: bookmark, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
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

				this.close();
			},
			...options,
		});
	}
}
