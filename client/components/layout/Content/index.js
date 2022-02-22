import './index.css';

import { DomElem } from 'vanilla-bean-components';

export class Content extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['content', className], ...rest });
	}
}
