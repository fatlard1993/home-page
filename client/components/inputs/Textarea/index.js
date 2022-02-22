import './index.css';

import DomElem from '../../DomElem';

export class Textarea extends DomElem {
	constructor({ className, value = '', ...rest }) {
		const initialValue = value;

		super('textarea', { className: ['textarea', className], value, ...rest });

		this.isDirty = () => initialValue !== this.value;
	}
}
