import './index.css';

import DomElem from '../DomElem';

export default class Tag extends DomElem {
	constructor({ appendTo, readOnly = false, className, tag, ...rest }) {
		super('li', {
			className: ['tag', className],
			appendTo,
			textContent: tag,
			onPointerPressAndHold: readOnly ? () => {} : () => this.remove(),
			...rest,
		});
	}
}
