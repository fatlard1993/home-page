import { ColorSwatch, styled } from '@vanilla-bean/components';

// The brush row's swatch: pressed is the brush color, outlined rather than filled, so the swatch keeps its own
export const BrushSwatch = styled(
	ColorSwatch,
	({ colors }) => `
		&[aria-pressed='true'] {
			outline: 3px solid ${colors.superWhite};
			outline-offset: 2px;
		}
	`,
);

// Clears a bookmark back to its category's color, or a category back to the default.
export const ClearColorSwatch = styled(
	BrushSwatch,
	({ colors }) => `
		border: 1px solid ${colors.light(colors.gray)};
		background: repeating-linear-gradient(
			45deg,
			${colors.dark(colors.gray)},
			${colors.dark(colors.gray)} 4px,
			${colors.gray} 4px,
			${colors.gray} 8px
		);
	`,
);

// Dashed border marks it as detected rather than chosen. Hidden until a detection actually lands.
export const BrandColorSwatch = styled(
	ColorSwatch,
	({ colors }) => `
		border: 2px dashed ${colors.white};
		display: none;

		&.detected {
			display: inline-block;
		}
	`,
);
