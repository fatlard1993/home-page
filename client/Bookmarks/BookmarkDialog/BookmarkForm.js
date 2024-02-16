import { DomElem, Form, ColorPicker, Input, Select, readClipboard } from 'vanilla-bean-components';

import { getCategories } from '../../api';
import { isLink } from '../util';

export default class BookmarkForm extends Form {
	async render() {
		const categories = (await getCategories({ onRefetch: this.render.bind(this) })).body;
		const clipboardContent = await readClipboard();

		this.newCategoryInput = new Input({
			type: 'text',
			style: { display: 'none' },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
			onChange: ({ value }) => {
				this.newCategoryInput.options.value = value;

				this.options.data.category = this.newCategoryInput.parent.options.value = { create: { name: value } };

				this.newCategoryInput.validate();
			},
		});

		const formData = {
			name: '',
			url: isLink(clipboardContent) ? clipboardContent : '',
			color: this.options.category?.color || 'random',
			category: this.options.category?.id || 'Default',
			...this.options.bookmark,
		};

		this.setOptions({
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

								this.newCategoryInput.elem.focus();

								this.options.data.category = this.newCategoryInput.parent.options.value = showNew ? this.newCategoryInput.options.value : value;
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

		super.render();

		this.inputElements.name.elem.focus();
	}
}
