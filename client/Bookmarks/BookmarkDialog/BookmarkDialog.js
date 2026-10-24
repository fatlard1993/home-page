import { FormDialog, Notify, failureReason } from '@vanilla-bean/components';

import { updateBookmark, createBookmark, setBookmarkFaviconFromDataUri, deleteBookmarkFavicon } from '../../api';
import { saveRecentColor } from '../util';

import { deleteQuestion } from '../confirmDeleteBookmark';
import deleteWithUndo from '../deleteWithUndo';
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
				const saved = await (isEdit ? updateBookmark(bookmark.id, { body }) : createBookmark({ body }));

				// A refused save stays open with the server's reason
				if (saved.status === 'error') return saved;

				const id = bookmark?.id ?? saved.body.id;

				let favicon;

				if (form._pendingFaviconDataUri) {
					favicon = await setBookmarkFaviconFromDataUri(id, form._pendingFaviconDataUri);
				} else if (!form.useFavicon && form.existingFaviconId) {
					favicon = await deleteBookmarkFavicon(id);
				}

				const faviconRefused = failureReason(favicon);

				// The bookmark itself is saved, so the dialog closes (a retry would create it twice); only the favicon is reported
				if (faviconRefused) {
					new Notify({
						intent: 'danger',
						timeout: 6000,
						content: `Saved "${body.name}", but not its favicon: ${faviconRefused}`,
					});
				}
			},
			...(isEdit && {
				// Asked over the form, so a no leaves the bookmark open as it was
				confirmDelete: { ...deleteQuestion(bookmark), intent: null },
				onDelete: () => deleteWithUndo({ bookmarks: [bookmark] }),
			}),
			...options,
		};
	}
}
