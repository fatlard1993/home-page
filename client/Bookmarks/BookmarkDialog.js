import { Dialog, Input, Button, ColorPicker, Select, Label, conditionalList, styled } from 'vanilla-bean-components';
import { createBookmark, deleteBookmark, updateBookmark, getCategories } from '../api';

const ColorPickerButton = styled(
	Button,
	() => `
		margin-top: 12px;
	`,
);

export default class BookmarkDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'large',
			header: `${options.bookmark ? 'Edit' : 'Create'} Bookmark${options.bookmark ? ` | ${options.bookmark.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: options.bookmark, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') {
					const validationErrors = [...this.nameInput.validate(), ...this.urlInput.validate(), ...(this.categorySelect.value === 'New' ? this.newCategoryInput.validate() : [])];

					if (validationErrors.length > 0) return;

					const color = this.colorPicker.value;
					const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

					recentColors.length = Math.min(recentColors.length, 10);

					localStorage.setItem('recentColors', JSON.stringify(recentColors));

					let category = this.categorySelect.value;

					if (category === 'Default') category = '';
					else if (category === 'New') category = this.newCategoryInput.value;

					if (this.options.bookmark) {
						updateBookmark(this.options.bookmark.id, { body: { name: this.nameInput.elem.value, url: this.urlInput.elem.value, category, color } });
					} else {
						createBookmark({ body: { name: this.nameInput.elem.value, url: this.urlInput.elem.value, category, color } });
					}
				} else if (button === 'Delete') {
					deleteBookmark(this.options.bookmark.id);
				}

				this.close();
			},
			...options,
		});
	}

	async render(options = this.options) {
		super.render(options);

		const { body: categories } = await getCategories();
		const { bookmark, category } = this.options;

		this.nameInput = new Input({ type: 'text', value: bookmark?.name || '', validations: [[/.+/, 'Required']] });
		this.urlInput = new Input({ type: 'text', value: bookmark?.url || '', validations: [[/.+/, 'Required']] });
		this.newCategoryInput = new Input({
			type: 'text',
			style: { display: 'none' },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
		});
		this.categorySelect = new Select({
			options: ['Default', 'New', ...Object.keys(categories).map(id => ({ label: categories?.[id]?.name, value: id }))],
			value: bookmark?.category || category?.id || 'Default',
			onChange: ({ value }) => (this.newCategoryInput.elem.style.display = value === 'New' ? 'block' : 'none'),
		});
		this.colorPicker = new ColorPicker({
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
					onPointerPress: () => this.colorPicker.set('random'),
				}),
				...(JSON.parse(localStorage.getItem('recentColors')) || []).map(
					backgroundColor =>
						new ColorPickerButton({
							icon: 'fill-drip',
							styles: ({ colors }) => `
								background: ${backgroundColor};
								color: ${colors.mostReadable(backgroundColor, [colors.white, colors.black])}
							`,
							onPointerPress: () => this.colorPicker.set(backgroundColor),
						}),
				),
			],
		});

		this._body.content([new Label('Name', this.nameInput), new Label('Url', this.urlInput), new Label('Category', this.categorySelect, this.newCategoryInput), new Label('Color', this.colorPicker)]);
	}
}
