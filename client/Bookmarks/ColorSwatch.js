import { Button, styled } from '@vanilla-bean/components';

/*
 * Every color swatch in the app builds on ColorSwatch, including the ones that sit in a row with
 * ColorPicker's own — so the base has to match what the library renders for its `swatches` option:
 * the same fill-drip glyph, which is what gives a swatch its size, and the same 3px spacing. A
 * swatch without the icon collapses to its padding and reads as a different control entirely.
 */
export const ColorSwatch = styled(
	Button,
	({ colors }) => `
		margin-top: 3px;
		margin-right: 3px;

		&.selected {
			outline: 3px solid ${colors.superWhite};
			outline-offset: 2px;
		}
	`,
	{ icon: 'fill-drip' },
);

// Clears a bookmark back to its category's color, or a category back to the default.
export const ClearColorSwatch = styled(
	ColorSwatch,
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

// The cycle ColorPicker runs on its own 'random' swatch, so the two read as the same control.
// Deliberately not reusing the library's keyframes by name: @keyframes are global, so `rainbow`
// would resolve to theirs today and break quietly the day they rename it.
export const RandomColorSwatch = styled(
	ColorSwatch,
	({ colors }) => `
		color: ${colors.black};
		animation: colorSwatchRainbow 2s linear infinite;

		@keyframes colorSwatchRainbow {
			100%, 0% {
				background-color: ${colors.light(colors.red)};
			}
			12% {
				background-color: ${colors.light(colors.orange)};
			}
			25% {
				background-color: ${colors.light(colors.yellow)};
			}
			37% {
				background-color: ${colors.light(colors.green)};
			}
			50% {
				background-color: ${colors.light(colors.teal)};
			}
			62% {
				background-color: ${colors.light(colors.blue)};
			}
			75% {
				background-color: ${colors.light(colors.purple)};
			}
			87% {
				background-color: ${colors.light(colors.pink)};
			}
		}
	`,
);
