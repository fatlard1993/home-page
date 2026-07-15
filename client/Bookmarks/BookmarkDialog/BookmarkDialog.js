import { Dialog, conditionalList } from '@vanilla-bean/components';

import { updateBookmark, createBookmark, setBookmarkFaviconFromDataUri, deleteBookmarkFavicon } from '../../api';
import { saveRecentColor, validateForm } from '../util';

import confirmDeleteBookmark from '../confirmDeleteBookmark';
import BookmarkForm from './BookmarkForm';

export default class BookmarkDialog extends Dialog {
	constructor(options = {}) {
		const isEdit = !!options.bookmark?.id;

		super({
			size: 'large',
			header: `${isEdit ? 'Edit' : 'Create'} Bookmark${isEdit ? ` | ${options.bookmark.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: isEdit, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: async ({ button }) => {
				if (button === 'Save') {
					if (validateForm(this.form)) return;

					const { color, category, favicon, ...rest } = this.form.options.data;

					// An untouched color is only a preview of what the bookmark would inherit
					// (category, then a default) — leave it unset so it keeps following that.
					const explicitColor = this.form.colorTouched ? color : '';

					if (explicitColor) saveRecentColor(explicitColor);

					const body = { ...rest, color: explicitColor, category: category === 'Default' ? '' : category };

					// The favicon field is managed entirely through its own endpoints below —
					// never sent as part of the regular bookmark update.
					let id = this.options.bookmark?.id;

					if (isEdit) {
						updateBookmark(id, { body });
					} else {
						id = (await createBookmark({ body })).body.id;
					}

					if (this.form._pendingFaviconDataUri) {
						setBookmarkFaviconFromDataUri(id, this.form._pendingFaviconDataUri);
					} else if (!this.form.useFavicon && this.form.existingFaviconId) {
						deleteBookmarkFavicon(id);
					}
				} else if (button === 'Delete') {
					confirmDeleteBookmark(this.options.bookmark);
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
