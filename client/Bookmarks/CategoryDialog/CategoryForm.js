import { ColorPicker, Form } from 'vanilla-bean-components';

export default class CategoryForm extends Form {
	render() {
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
					swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
					collapsed: !formData?.color,
				},
			],
		});

		super.render();
	}
}
