import { Button, Elem, styled } from '@vanilla-bean/components';

const shortLabel = label => label.replace(/\s*search results$/i, '');

export default class SearchEngineButtons extends styled.Label(
	({ colors }) => `
	margin: 10px 0 1px;
	padding: 8px 12px 10px;
	background-color: ${colors.alpha(colors.white, 0.03)};
	border-top: 1px solid ${colors.alpha(colors.white, 0.12)};

	label {
		font-weight: normal;
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: ${colors.alpha(colors.white, 0.45)};
		pointer-events: none;
	}

	div {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-left: 6px;
		margin-top: 6px;
	}
`,
) {
	static handlers = {
		engines(value) {
			if (!this.buttonContainer) this.buttonContainer = new Elem({ appendTo: this });

			this.buttonContainer.content(
				value.map(
					engine =>
						new Button({
							textContent: shortLabel(engine.label),
							onPointerPress: () => this.options.onActivate?.(engine.id),
							styles: ({ colors }) => ({
								background: 'transparent',
								color: colors.light(colors.gray),
								border: `1px solid ${colors.gray}`,
								boxShadow: 'none',
							}),
						}),
				),
			);
		},
		onActivate() {},
	};
}
