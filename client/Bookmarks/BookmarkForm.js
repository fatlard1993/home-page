import { Input, ColorPicker, Select, Label, DomElem, readClipboard } from 'vanilla-bean-components';

import { createBookmark, updateBookmark, getCategories } from '../api';
import { isLink } from './util';

export default class BookmarkForm extends DomElem {
	async render(options = this.options) {
		super.render(options);

		const categories = (await getCategories({ onRefetch: this.render.bind(this) })).body;

		const { bookmark, category } = this.options;

		const clipboardContent = await readClipboard();

		this.nameInput = new Input({ type: 'text', value: bookmark?.name || '', validations: [[/.+/, 'Required']] });
		this.urlInput = new Input({ type: 'text', value: bookmark?.url || (isLink(clipboardContent) ? clipboardContent : ''), validations: [[/.+/, 'Required']] });
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
			value: bookmark?.color || category?.color || 'random',
			swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
		});

		this.content([new Label('Name', this.nameInput), new Label('Url', this.urlInput), new Label('Category', this.categorySelect, this.newCategoryInput), new Label('Color', this.colorPicker)]);
	}

	save() {
		const validationErrors = [...this.nameInput.validate(), ...this.urlInput.validate(), ...(this.categorySelect.value === 'New' ? this.newCategoryInput.validate() : [])];

		if (validationErrors.length > 0) return;

		const color = this.colorPicker.value;
		const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];

		recentColors.length = Math.min(recentColors.length, 10);

		localStorage.setItem('recentColors', JSON.stringify(recentColors));

		let category = this.categorySelect.value;

		if (category === 'Default') category = '';
		else if (category === 'New') category = this.newCategoryInput.value;

		if (this.options.bookmark.id) {
			updateBookmark(this.options.bookmark.id, { body: { name: this.nameInput.elem.value, url: this.urlInput.elem.value, category, color } });
		} else {
			createBookmark({ body: { name: this.nameInput.elem.value, url: this.urlInput.elem.value, category, color } });
		}
	}
}
