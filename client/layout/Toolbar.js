import { DomElem } from 'vanilla-bean-components';

export class Toolbar extends DomElem {
	constructor({ styles = () => '', ...options }) {
		super({
			styles: ({ colors, ...theme }) => `
				display: flex;
				flex-direction: row;
				background-image: linear-gradient(to bottom, ${colors.darkest(colors.gray)} 90%, rgb(0 0 0 / 0%));
				position: relative;
				margin: 12px 12px 0 12px;

				${styles({ colors, ...theme })}
			`,
			...options,
		});
	}
}
