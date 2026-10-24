import { ColorPicker, FormDialog } from '@vanilla-bean/components';

import { createCategory, updateCategory } from '../../api';
import { getRecentColors, required, saveRecentColor } from '../util';

import DeleteCategoryDialog from '../DeleteCategoryDialog';

export default class CategoryDialog extends FormDialog {
	static schema = {
		category: {},
	};

	static prepareOptions(options) {
		const { category } = options;
		const isEdit = !!category?.id;
		const data = { name: '', color: '', ...category };

		return {
			header: `${isEdit ? 'Edit' : 'Create'} Category${isEdit ? ` | ${category.name}` : ''}`,
			data,
			inputs: [
				{ key: 'name', validate: required },
				{
					key: 'color',
					label: 'Default Color',
					InputComponent: ColorPicker,
					swatches: ['random', ...getRecentColors()],
					collapsed: !data.color,
				},
			],
			onSave: body => {
				saveRecentColor(body.color);

				return isEdit ? updateCategory(category.id, { body }) : createCategory({ body });
			},
			// Deleting a category asks what becomes of its bookmarks, which is more than a yes or no
			...(isEdit && { onDelete: () => new DeleteCategoryDialog({ category }) }),
			...options,
		};
	}
}
