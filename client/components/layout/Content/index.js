import './index.css';

import DomElem from '../../DomElem';

export class Content extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['content', className], ...rest });
	}
}
