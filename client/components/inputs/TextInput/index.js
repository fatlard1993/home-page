import './index.css';

import DomElem from '../../DomElem';

export class TextInput extends DomElem {
	constructor({ className, value = '', ...rest }) {
		const initialValue = value;

		super('input', { type: 'text', className: ['textInput', className], value, ...rest });

		this.isDirty = () => initialValue !== this.value;
	}
}
