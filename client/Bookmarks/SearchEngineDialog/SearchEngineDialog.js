import { Dialog, conditionalList } from '@vanilla-bean/components';

import { createSearchEngine, updateSearchEngine, deleteSearchEngine } from '../../api';

import SearchEngineForm from './SearchEngineForm';

export default class SearchEngineDialog extends Dialog {
	constructor(options = {}) {
		const isEdit = !!options.engine?.id;

		super({
			size: 'large',
			header: `${isEdit ? 'Edit' : 'Add'} Search Engine${isEdit ? ` | ${options.engine.label}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: isEdit, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: ({ button }) => {
				if (button === 'Save') {
					if (this.form.validate()) return;

					if (isEdit) {
						updateSearchEngine(this.options.engine.id, { body: this.form.options.data });
					} else {
						createSearchEngine({ body: this.form.options.data });
					}
				} else if (button === 'Delete') {
					deleteSearchEngine(this.options.engine.id);
				}

				this.close();
			},
			...options,
		});

		this.form = new SearchEngineForm({ appendTo: this._body, engine: this.options.engine });
	}
}
