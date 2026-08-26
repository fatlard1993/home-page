import { ColorPicker, Form } from '@vanilla-bean/components';

import { getRecentColors } from '../util';

export default class CategoryForm extends Form {
	build() {
		const formData = {
			name: '',
			color: '',
			...this.options.category,
		};

		this.setOptions({
			data: formData,
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{
					key: 'color',
					label: 'Default Color',
					InputComponent: ColorPicker,
					swatches: ['random', ...getRecentColors()],
					collapsed: !formData?.color,
				},
			],
		});

		super.build();
	}
}
