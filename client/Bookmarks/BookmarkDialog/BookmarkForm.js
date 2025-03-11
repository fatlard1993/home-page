import { Form, ColorPicker, Input, Select, readClipboard } from 'vanilla-bean-components';

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

	async render() {
		const categories = (await getCategories()).body;
		const clipboardContent = await readClipboard();

		if (!this.options.data.url && isLink(clipboardContent)) this.options.data.url = clipboardContent;

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

		// this.categorySelect = new Select({
		// 	value: this.options.data.category,
		// 	options: ['Default', 'New', ...Object.keys(categories).map(id => ({ label: categories?.[id]?.name, value: id }))],
		// 	onChange: ({ value }) => {
		// 		console.log('XXX');
		// 		const showNew = value === 'New';
		// 		this.newCategoryInput.elem.style.display = showNew ? 'block' : 'none';

		// 		this.newCategoryInput.elem.focus();

		// 		this.options.data.category = this.newCategoryInput.parent.options.value = showNew
		// 			? this.newCategoryInput.options.value
		// 			: value;
		// 	},
		// });

		this.options.inputs = [
			{ key: 'name', validations: [[/.+/, 'Required']] },
			{ key: 'url', validations: [[/.+/, 'Required']] },
			{
				key: 'category',
				InputComponent: Select,
				options: [
					'Default',
					{ label: 'New', value: this.uniqueId },
					...Object.keys(categories).map(id => ({ label: categories?.[id]?.name, value: id })),
				],
				append: [this.newCategoryInput],
				// validate: () => {
				// 	if (this.newCategoryInput.elem.style.display === 'block') return this.newCategoryInput.validate();
				// },
			},
			{
				key: 'color',
				InputComponent: ColorPicker,
				parse: (value, input) => input.parseValue(value).hslString,
				swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
			},
		];

		super.render();

		this.inputElements.name.elem.focus();
	}
}
