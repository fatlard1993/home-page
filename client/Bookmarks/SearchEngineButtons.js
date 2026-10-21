import { Button, Elem, SectionLabel, styled } from '@vanilla-bean/components';

const shortLabel = label => label.replace(/\s*search results$/i, '');

export default class SearchEngineButtons extends styled.Component(
	({ space }) => `
	.engines {
		display: flex;
		flex-wrap: wrap;
		gap: ${space.sm};
	}
`,
) {
	static schema = {
		label: {
			set(value) {
				this.heading.options.textContent = value;
			},
		},
		engines: {
			set(value) {
				this.buttonContainer.content(
					value.map(
						engine =>
							new Button({
								variant: 'chip',
								textContent: shortLabel(engine.label),
								onPointerPress: () => this.options.onActivate?.(engine.id),
							}),
					),
				);
			},
		},
		onActivate: {},
	};

	build() {
		this.heading = new SectionLabel({ appendTo: this });
		this.buttonContainer = new Elem({ addClass: 'engines', appendTo: this });
	}
}
