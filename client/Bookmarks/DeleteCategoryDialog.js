import { Dialog, Select, Input, Label, Notify } from '@vanilla-bean/components';
import { failureReason } from '@vanilla-bean/hypertether';

import { getCategories, deleteCategory } from '../api';

export default class DeleteCategoryDialog extends Dialog {
	constructor(options = {}) {
		options.keepBookmarks = options.keepBookmarks ?? true;

		super({
			size: 'standard',
			header: `Delete ${options.category.name}?`,
			// Safe choice first: the dialog focuses its first button, so a reflexive Enter cancels
			// instead of deleting.
			buttons: ['Cancel', 'Delete'],
			...options,
		});
	}

	async render() {
		const categoriesResponse = await getCategories();
		const refused = failureReason(categoriesResponse);

		// Default is still somewhere to move the bookmarks to
		if (refused) new Notify({ type: 'error', timeout: 6000, content: `Could not load the categories: ${refused}` });

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
				const reason = failureReason(
					await deleteCategory(
						this.options.category.id,
						this.options.keepBookmarks ? { searchParameters: { moveTo: moveTo.value } } : {},
					),
				);

				// A refused delete leaves the question open, as it was
				if (reason) {
					new Notify({
						type: 'error',
						timeout: 6000,
						content: `Could not delete "${this.options.category.name}": ${reason}`,
					});

					return;
				}
			}

			closeDialog();
		};

		this.options.body = [new Label('Keep Bookmarks?', checkbox), new Label('Move To', moveTo)];

		super.render();
	}
}
