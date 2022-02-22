import './index.css';

import DomElem from '../DomElem';

export default class Popover extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['popover', className], ...rest });
	}
}
