import './index.css';

import DomElem from '../DomElem';

export default class NoData extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['noData', className], ...rest });
	}
}
