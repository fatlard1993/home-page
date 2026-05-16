import { Dialog, conditionalList } from 'vanilla-bean-components';

import { deleteBookmark, updateBookmark, createBookmark } from '../../api';
import { saveRecentColor } from '../util';

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

					saveRecentColor(color);

					if (category === 'Default') this.form.options.data.category = '';

					if (isEdit) {
						updateBookmark(this.options.bookmark.id, { body: this.form.options.data });
					} else {
						createBookmark({ body: this.form.options.data });
					}
				} else if (button === 'Delete') {
					deleteBookmark(this.options.bookmark.id);
				}

				this.close();
			},
			...options,
		});

		this.form = new BookmarkForm({
			appendTo: this._body,
			data: this.options.bookmark,
			category: this.options.category,
		});
	}
}
