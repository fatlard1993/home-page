import './index.css';

import DomElem from '../../DomElem';
import { Button } from '../../inputs';

export default class Dialog extends DomElem {
	constructor({ className, header, content, footer, buttons, onDismiss = () => {}, closeDialog, size, ...rest }) {
		super('div', {
			className: ['dialog', className, size],
			appendChildren: [
				new DomElem('div', { className: 'header', [typeof header === 'string' ? 'textContent' : 'appendChildren']: header }),
				new DomElem('div', { className: 'content', [typeof content === 'string' ? 'textContent' : 'appendChildren']: content }),
				new DomElem('div', {
					className: 'footer',
					appendChildren: footer || buttons.map(button => new Button({ textContent: button, onPointerPress: () => onDismiss({ button, closeDialog: closeDialog || (() => super.cleanup()) }) })),
				}),
			],
			...rest,
		});
	}
}
