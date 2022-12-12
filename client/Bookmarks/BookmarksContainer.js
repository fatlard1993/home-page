import { DomElem } from 'vanilla-bean-components';

export default class BookmarksContainer extends DomElem {
	constructor({ heading = '', appendChild, appendChildren, ...options }) {
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

				.DomElem.Link {
					margin: 0;
					flex: 1 0 auto;
				}
			`,
			appendChildren: [
				typeof heading === 'string' ? new DomElem({ tag: 'h2', textContent: heading }) : heading,
				...(appendChildren ? (Array.isArray(appendChildren) ? appendChildren : [appendChildren]) : []),
				...(appendChild ? [appendChild] : []),
			],
			...options,
		});
	}
}
