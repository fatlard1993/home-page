import { FormDialog, Input, Select } from '@vanilla-bean/components';

import { createSearchEngine, updateSearchEngine, deleteSearchEngine } from '../../api';

export default class SearchEngineDialog extends FormDialog {
	static schema = {
		engine: {},
	};

	static prepareOptions(options) {
		const { engine } = options;
		const isEdit = !!engine?.id;
		const data = {
			label: '',
			url: '',
			resultsPath: '',
			nameResultsPath: '',
			nameProperty: '',
			urlProperty: '',
			limit: 5,
			default: false,
			orderBy: { property: '', direction: 'asc' },
			...engine,
		};

		return {
			header: `${isEdit ? 'Edit' : 'Add'} Search Engine${isEdit ? ` | ${engine.label}` : ''}`,
			data,
			inputs: [
				{ key: 'label', validations: [[/.+/, 'Required']] },
				{
					key: 'default',
					label: 'Default (runs automatically with every search, others load on-demand)',
					type: 'checkbox',
				},
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
					collapsed: !data.orderBy?.property,
				},
			],
			onSave: body => (isEdit ? updateSearchEngine(engine.id, { body }) : createSearchEngine({ body })),
			...(isEdit && { onDelete: () => deleteSearchEngine(engine.id) }),
			...options,
		};
	}
}
