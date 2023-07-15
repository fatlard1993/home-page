import { DomElem } from 'vanilla-bean-components';

export default class BookmarksContainer extends DomElem {
	constructor({ heading = '', ...options }) {
		super({
			styles: () => `
				margin: 0 1%;
				display: flex;
				flex-wrap: wrap;
				gap: 6px;

				h2 {
					margin: 6px 6px 0;
					flex-basis: 100%;
				}
			`,
			...options,
		});

		this.prepend(typeof heading === 'string' ? new DomElem({ tag: 'h2', textContent: heading }) : heading);
	}
}
