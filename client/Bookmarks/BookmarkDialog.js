import { Dialog, conditionalList } from 'vanilla-bean-components';

import { deleteBookmark } from '../api';

import BookmarkForm from './BookmarkForm';

export default class BookmarkDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'large',
			header: `${options.bookmark ? 'Edit' : 'Create'} Bookmark${options.bookmark ? ` | ${options.bookmark.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: options.bookmark, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') this.form.save();
				else if (button === 'Delete') {
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

		this.form = new BookmarkForm({ appendTo: this._body, bookmark, category });
	}
}
