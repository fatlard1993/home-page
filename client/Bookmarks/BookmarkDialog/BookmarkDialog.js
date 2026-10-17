import { FormDialog } from '@vanilla-bean/components';

import { updateBookmark, createBookmark, setBookmarkFaviconFromDataUri, deleteBookmarkFavicon } from '../../api';
import { saveRecentColor } from '../util';

import { deleteBookmark, deleteQuestion } from '../confirmDeleteBookmark';
import BookmarkForm from './BookmarkForm';

export default class BookmarkDialog extends FormDialog {
	static schema = {
		FormComponent: { default: BookmarkForm },
		bookmark: {},
		// The category a new bookmark lands in
		category: {},
	};

	static prepareOptions(options) {
		const { bookmark, category } = options;
		const isEdit = !!bookmark?.id;

		return {
			header: `${isEdit ? 'Edit' : 'Create'} Bookmark${isEdit ? ` | ${bookmark.name}` : ''}`,
			data: bookmark,
			formOptions: { category },
			onSave: async ({ color, category: chosenCategory, favicon: _favicon, ...rest }, { form }) => {
				// An untouched color is only a preview of what the bookmark would inherit
				// (category, then a default) — leave it unset so it keeps following that.
				const explicitColor = form.colorTouched ? color : '';

				if (explicitColor) saveRecentColor(explicitColor);

				const body = { ...rest, color: explicitColor, category: chosenCategory === 'Default' ? '' : chosenCategory };

				// The favicon field is managed entirely through its own endpoints below —
				// never sent as part of the regular bookmark update.
				let id = bookmark?.id;

				if (isEdit) {
					updateBookmark(id, { body });
				} else {
					id = (await createBookmark({ body })).body.id;
				}

				if (form._pendingFaviconDataUri) {
					setBookmarkFaviconFromDataUri(id, form._pendingFaviconDataUri);
				} else if (!form.useFavicon && form.existingFaviconId) {
					deleteBookmarkFavicon(id);
				}
			},
			...(isEdit && {
				// Asked over the form, so a no leaves the bookmark open as it was
				confirmDelete: { ...deleteQuestion(bookmark), variant: null },
				onDelete: () => deleteBookmark(bookmark),
			}),
			...options,
		};
	}
}
