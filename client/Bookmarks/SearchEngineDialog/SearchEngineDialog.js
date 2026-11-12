import { FormDialog, Input, Select } from '@vanilla-bean/components';

import { createSearchEngine, updateSearchEngine, deleteSearchEngine } from '../../api';
import { required } from '../util';

// The stored orderBy is { property, direction }, or a bare property name on an engine written by hand. The form holds
// the two flat: a Form key is one data key, so a dotted key would be a field of its own, which the store drops
const orderByFields = orderBy => {
	const { property = '', direction = 'asc' } = typeof orderBy === 'string' ? { property: orderBy } : (orderBy ?? {});

	return { orderByProperty: property, orderByDirection: direction };
};

export default class SearchEngineDialog extends FormDialog {
	static schema = {
		engine: {},
	};

	static prepareOptions(options) {
		const { engine } = options;
		const isEdit = !!engine?.id;
		const { orderBy, ...fields } = engine ?? {};
		const data = {
			label: '',
			url: '',
			resultsPath: '',
			nameResultsPath: '',
			nameProperty: '',
			urlProperty: '',
			limit: 5,
			default: false,
			...fields,
			...orderByFields(orderBy),
		};

		return {
			header: `${isEdit ? 'Edit' : 'Add'} Search Engine${isEdit ? ` | ${engine.label}` : ''}`,
			data,
			inputs: [
				{ key: 'label', validate: required },
				{
					key: 'default',
					label: 'Default (runs automatically with every search, others load on-demand)',
					type: 'checkbox',
				},
				{
					key: 'url',
					label: 'URL',
					placeholder: 'https://api.example.com/search?q=:term',
					validate: required,
				},
				{
					key: 'resultsPath',
					label: 'Results Path',
					placeholder: 'JSON key for results array',
					validate: required,
				},
				{
					key: 'nameResultsPath',
					label: 'Name Results Path',
					placeholder: 'Separate key for names (blank = use results path)',
				},
				{ key: 'nameProperty', label: 'Name Property', placeholder: 'Field for display name (blank = item itself)' },
				{ key: 'urlProperty', label: 'URL Property', placeholder: 'Field for URL (blank = item itself)' },
				{ key: 'limit', InputComponent: Input, type: 'number' },
				{
					key: 'orderByProperty',
					label: 'Order By',
					InputComponent: Select,
					// Results are normalized to name and url before they are sorted, so those are the only fields to sort on
					options: [{ label: 'Engine order', value: '' }, 'name', 'url'],
				},
				{
					key: 'orderByDirection',
					label: 'Direction',
					InputComponent: Select,
					options: ['asc', 'desc'],
					condition: ({ orderByProperty }) => !!orderByProperty,
				},
			],
			onSave: ({ orderByProperty, orderByDirection, ...body }) => {
				body.orderBy = { property: orderByProperty, direction: orderByDirection };

				return isEdit ? updateSearchEngine(engine.id, { body }) : createSearchEngine({ body });
			},
			// Nothing brings a deleted engine back, so Delete asks first
			...(isEdit && {
				onDelete: () => deleteSearchEngine(engine.id),
				confirmDelete: `Delete the search engine "${engine.label}"? This cannot be undone.`,
			}),
			...options,
		};
	}
}
