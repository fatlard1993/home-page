import './index.css';

import DomElem from '../../DomElem';

export class Select extends DomElem {
	constructor({ value = '', ...rest }) {
		const initialValue = value;

		super('select', { value, ...rest });

		this.isDirty = () => initialValue !== this.value;

		return this;
	}
}
