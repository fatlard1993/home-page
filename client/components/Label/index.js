import './index.css';

import DomElem from '../DomElem';

export default class Label extends DomElem {
	constructor({ className, label, elem, ...rest }) {
		super('div', { className: ['label', className], ...rest });

		if (elem) {
			this.elem = elem;

			super.prependChild(elem);
		}

		if (label) super.prependChild(new DomElem('div', { className: 'label-text', textContent: label }));
	}
}
