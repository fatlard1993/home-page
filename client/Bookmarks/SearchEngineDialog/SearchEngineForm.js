import { Form, Input, Select } from '@vanilla-bean/components';

export default class SearchEngineForm extends Form {
	build() {
		const formData = {
			label: '',
			url: '',
			resultsPath: '',
			nameResultsPath: '',
			nameProperty: '',
			urlProperty: '',
			limit: 5,
			orderBy: { property: '', direction: 'asc' },
			...this.options.engine,
		};

		this.setOptions({
			data: formData,
			inputs: [
				{ key: 'label', validations: [[/.+/, 'Required']] },
				{
					key: 'url',
					label: 'URL',
					placeholder: 'https://api.example.com/search?q=:term',
					validations: [[/.+/, 'Required']],
				},
				{
					key: 'resultsPath',
					label: 'Results Path',
					placeholder: 'JSON key for results array',
					validations: [[/.+/, 'Required']],
				},
				{
					key: 'nameResultsPath',
					label: 'Name Results Path',
					placeholder: 'Separate key for names (blank = use results path)',
				},
				{ key: 'nameProperty', label: 'Name Property', placeholder: 'Field for display name (blank = item itself)' },
				{ key: 'urlProperty', label: 'URL Property', placeholder: 'Field for URL (blank = item itself)' },
				{ key: 'limit', InputComponent: Input, type: 'number' },
				{ key: 'orderBy.property', label: 'Order By', placeholder: 'Sort field (blank = no sort)' },
				{
					key: 'orderBy.direction',
					label: 'Direction',
					InputComponent: Select,
					options: ['asc', 'desc'],
					collapsed: !formData.orderBy?.property,
				},
			],
		});

		super.build();

		requestAnimationFrame(() => this.inputElements.label?.elem.focus());
	}
}
