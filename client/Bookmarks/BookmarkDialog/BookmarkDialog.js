import { Dialog, conditionalList } from '@vanilla-bean/components';

import { deleteBookmark, updateBookmark, createBookmark } from '../../api';
import { saveRecentColor, validateForm } from '../util';

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
					if (validateForm(this.form)) return;

					const { color, category, ...rest } = this.form.options.data;

					saveRecentColor(color);

					const body = { ...rest, color, category: category === 'Default' ? '' : category };

					if (isEdit) {
						updateBookmark(this.options.bookmark.id, { body });
					} else {
						createBookmark({ body });
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
