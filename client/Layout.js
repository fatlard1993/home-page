import { DomElem, styled } from 'vanilla-bean-components';

export const Content = styled(
	DomElem,
	() => `
		margin: 0 0 6px;
		overflow: auto;
	`,
);

export const Toolbar = styled(
	DomElem,
	({ colors }) => `
		display: flex;
		flex-direction: row;
		background-image: linear-gradient(to bottom, ${colors.darkest(colors.gray)} 90%, rgb(0 0 0 / 0%));
		position: relative;
		margin: 12px 12px 0 12px;
	`,
);
