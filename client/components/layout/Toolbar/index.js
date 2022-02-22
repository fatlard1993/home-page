import './index.css';

import { DomElem } from 'vanilla-bean-components';

export class Toolbar extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['toolbar', className], ...rest });
	}
}
