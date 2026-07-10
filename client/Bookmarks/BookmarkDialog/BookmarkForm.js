import { Form, ColorPicker, Input, Select, readClipboard } from '@vanilla-bean/components';

import { getCategories } from '../../api';
import { isLink } from '../util';

export default class BookmarkForm extends Form {
	constructor(options = {}) {
		super({
			...options,
			data: {
				name: '',
				url: '',
				color: options.category?.color || 'random',
				category: options.category?.id || 'Default',
				...options.data,
			},
		});
	}

	build() {
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

		this.setOptions({
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{ key: 'url', validations: [[/.+/, 'Required']] },
				{
					key: 'category',
					InputComponent: Select,
					options: ['Default', { label: 'New', value: this.uniqueId }],
					append: [this.newCategoryInput],
				},
				{
					key: 'color',
					InputComponent: ColorPicker,
					parse: (value, input) => input.parseValue(value).hslString,
					swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
				},
			],
		});

		super.build();

		this._populateAsyncFields();
	}

	async _populateAsyncFields() {
		const { body: categories } = await getCategories();

		if (!this.rendered) return;

		this.inputElements.category.options.options = [
			'Default',
			{ label: 'New', value: this.uniqueId },
			...Object.keys(categories).map(id => ({ label: categories[id]?.name, value: id })),
		];

		this.inputElements.name.elem.focus();

		// Clipboard access can reject (permission denied) or never settle (unanswered prompt);
		// isolate it so it can't block category population above.
		readClipboard()
			.then(clipboardContent => {
				if (this.rendered && !this.options.data.url && isLink(clipboardContent)) {
					this.options.data.url = clipboardContent;
				}
			})
			.catch(() => {});
	}
}
