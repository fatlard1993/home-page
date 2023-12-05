import { DomElem, Dialog, Form, ColorPicker, Input, Select, conditionalList, readClipboard } from 'vanilla-bean-components';

import { deleteBookmark, getCategories, updateBookmark, createBookmark } from '../api';
import { isLink } from './util';

export default class BookmarkDialog extends Dialog {
	constructor(options = {}) {
		const isEdit = !!options.bookmark?.id;

		super({
			size: 'large',
			header: `${isEdit ? 'Edit' : 'Create'} Bookmark${isEdit ? ` | ${options.bookmark.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: isEdit, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') {
					if (this.form.validate()) return;

					const { color, category } = this.form.data;

					if (color && color !== 'random') {
						const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];
						recentColors.length = Math.min(recentColors.length, 10);
						localStorage.setItem('recentColors', JSON.stringify(recentColors));
					}

					if (category === 'Default') this.form.data.category = '';
					else if (category === 'New') this.form.data.category = this.newCategoryInput.value;

					if (isEdit) {
						updateBookmark(this.options.bookmark.id, { body: this.form.data });
					} else {
						createBookmark({ body: this.form.data });
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

		const { bookmark, category } = this.options;

		const categories = (await getCategories({ onRefetch: this.render.bind(this) })).body;
		const clipboardContent = await readClipboard();

		this.newCategoryInput = new Input({
			type: 'text',
			style: { display: 'none' },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
		});

		const formData = { name: '', url: isLink(clipboardContent) ? clipboardContent : '', color: category?.color || 'random', category: category?.id || 'Default', ...bookmark };

		this.form = new Form({
			appendTo: this._body,
			data: formData,
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{ key: 'url', validations: [[/.+/, 'Required']] },
				{
					key: 'category',
					Component: DomElem,
					append: [
						new Select({
							value: formData.category,
							options: ['Default', 'New', ...Object.keys(categories).map(id => ({ label: categories?.[id]?.name, value: id }))],
							onChange: ({ value }) => {
								const showNew = value === 'New';
								this.newCategoryInput.elem.style.display = showNew ? 'block' : 'none';

								this.newCategoryInput.validate({ clear: !showNew });
							},
						}),
						this.newCategoryInput,
					],
					validate: () => {
						if (this.newCategoryInput.elem.style.display === 'block') return this.newCategoryInput.validate();
					},
				},
				{ key: 'color', Component: ColorPicker, swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])] },
			],
		});
	}
}
