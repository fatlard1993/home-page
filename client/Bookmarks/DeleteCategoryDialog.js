import { Dialog, Select, Input, Label, Notify, failureReason } from '@vanilla-bean/components';

import { getBookmarks, getCategories } from '../api';
import { deleteCategoryWithUndo } from './deleteWithUndo';

export default class DeleteCategoryDialog extends Dialog {
	constructor(options = {}) {
		options.keepBookmarks = options.keepBookmarks ?? true;

		// Not a danger confirm: the delete is toasted with Undo. The dialog is here to ask where the bookmarks go.
		super({
			size: 'standard',
			header: `Delete ${options.category.name}?`,
			// The safe way out first, the verb last
			buttons: [{ textContent: 'Cancel', 'data-action': 'cancel' }, 'Delete'],
			...options,
		});
	}

	async render() {
		const categoriesResponse = await getCategories();
		const refused = failureReason(categoriesResponse);

		// Default is still somewhere to move the bookmarks to
		if (refused) new Notify({ intent: 'danger', content: `Could not load the categories: ${refused}` });

		const categories = refused ? {} : categoriesResponse.body;

		this.options.onDisconnected = () => {
			categoriesResponse.unsubscribe();
		};

		const moveTo = new Select({
			options: [
				{ label: 'Default', value: '' },
				// The category going away is no place to keep its bookmarks
				...Object.keys(categories)
					.filter(id => id !== this.options.category.id)
					.map(id => ({
						label: categories?.[id]?.name,
						value: id,
					})),
			],
			value: '',
		});

		const checkbox = new Input({
			type: 'checkbox',
			name: 'Keep bookmarks',
			value: true,
			onChange: ({ value }) => {
				checkbox.options.value = this.options.keepBookmarks = value;
				moveTo.parent.elem.style.display = value ? 'block' : 'none';
			},
		});

		this.options.onButtonPress = async ({ button, closeDialog }) => {
			if (button === 'Delete') {
				const { id, name } = this.options.category;

				try {
					// Read fresh, so the undo puts back what is in the category now, and where
					const bookmarksResponse = await getBookmarks();

					bookmarksResponse.unsubscribe?.();

					const refused = failureReason(bookmarksResponse);

					if (refused) throw new Error(refused);

					await deleteCategoryWithUndo({
						category: { ...this.options.category, ...categories[id] },
						bookmarks: Object.values(bookmarksResponse.body).filter(bookmark => bookmark?.category === id),
						...(this.options.keepBookmarks && {
							moveTo: moveTo.value,
							moveToName: categories[moveTo.value]?.name ?? 'Default',
						}),
					});
				} catch (error) {
					// A refused delete leaves the question open, as it was
					new Notify({ intent: 'danger', content: `Could not delete "${name}": ${error.message}` });

					return;
				}
			}

			closeDialog();
		};

		this.options.body = [
			new Label({ label: 'Keep Bookmarks?', variant: 'inline-after' }, checkbox),
			new Label('Move To', moveTo),
		];

		super.render();
	}
}
