import './index.css';

import DomElem from '../DomElem';

export default class Modal extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['modal', className], ...rest });
	}
}
