import { DomElem, Link } from 'vanilla-bean-components';
import { fixLink } from './util';

export default class BookmarksContainer extends DomElem {
	constructor({ heading = '', bookmarks = [], ...options }) {
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

		this.append(
			bookmarks.map(
				({ name, url, color, ...options }) =>
					new Link({
						textContent: name,
						href: fixLink(url),
						styles: ({ colors }) => `
							background: ${color || colors.blue};
							color: ${colors.mostReadable(color || colors.blue, [colors.white, colors.black])}
						`,
						...options,
					}),
			),
		);
	}
}
