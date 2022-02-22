import './index.css';

import DomElem from '../DomElem';

export default class Link extends DomElem {
	constructor({ className, ...rest }) {
		super('a', { className: ['link', className], ...rest });
	}
}
