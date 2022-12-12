import { DomElem } from 'vanilla-bean-components';

export class Content extends DomElem {
	constructor({ styles = () => '', ...options }) {
		super({
			styles: theme => `
				margin: 0 0 6px;
				overflow: auto;

				${styles(theme)}
			`,
			...options,
		});
	}
}
