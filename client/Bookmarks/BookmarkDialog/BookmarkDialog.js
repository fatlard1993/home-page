import { Dialog, conditionalList } from 'vanilla-bean-components';

import { deleteBookmark, updateBookmark, createBookmark } from '../../api';

import BookmarkForm from './BookmarkForm';

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

					const { color, category } = this.form.options.data;

					if (color && color !== 'random') {
						const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];
						recentColors.length = Math.min(recentColors.length, 10);
						localStorage.setItem('recentColors', JSON.stringify(recentColors));
					}

					if (category === 'Default') this.form.options.data.category = '';
					else if (category === 'New') this.form.options.data.category = this.newCategoryInput.elem.value;

					if (isEdit) {
						updateBookmark(this.options.bookmark.id, { body: this.form.options.data });
					} else {
						createBookmark({ body: this.form.options.data });
					}
				} else if (button === 'Delete') {
					deleteBookmark(this.options.bookmark.id);
				}

				this.elem.remove();
			},
			...options,
		});

		this.form = new BookmarkForm({ appendTo: this._body, bookmark: this.options.bookmark, category: this.options.category });
	}
}
