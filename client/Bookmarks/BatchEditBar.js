import { Elem, Button, Icon, Label, ColorPicker, styled, theme } from '@vanilla-bean/components';

import { ColorSwatch, ClearColorSwatch, RandomColorSwatch } from './ColorSwatch';
import { getRecentColors } from './util';

export default class BatchEditBar extends styled.Component(
	({ colors }) => `
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin: 12px;
		padding: 10px 16px;
		border: 3px dashed ${colors.red};
		background: ${colors.alpha(colors.red, 0.14)};
		border-radius: 4px;
		box-shadow: 0 0 0 1px ${colors.alpha(colors.red, 0.5)};

		&.paintMode {
			border-color: ${colors.purple};
			background: ${colors.alpha(colors.purple, 0.14)};
			box-shadow: 0 0 0 1px ${colors.alpha(colors.purple, 0.5)};

			.modeIcon {
				color: ${colors.light(colors.purple)};
			}

			.brush {
				display: flex;
			}

			.customColor {
				display: block;
			}

			.markedCount {
				display: none;
			}
		}

		/*
		 * Its own class, not the generic .icon: Icon adds .icon to every color swatch in the brush
		 * row, so styling .icon here would size and recolor those along with the mode indicator.
		 */
		.modeIcon {
			font-size: 1.4em;
			color: ${colors.light(colors.red)};
		}

		.label {
			flex: 1;
			min-width: 220px;
			font-weight: bold;
			font-size: 1.05em;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			color: ${colors.superWhite};
		}

		.markedCount {
			font-weight: bold;
			color: ${colors.light(colors.red)};
		}

		.modeToggle {
			display: flex;
			gap: 4px;
		}

		/* No gap: the swatches carry ColorPicker's own 3px margins, so the two would compound and
		   space this row wider than the identical row inside the bookmark and category forms. */
		.brush {
			display: none;
			flex-wrap: wrap;
			align-items: center;
		}

		/* Full width so the picker it holds drops onto its own row rather than stretching the bar. */
		.customColor {
			display: none;
			flex-basis: 100%;
		}

		/*
		 * Only the glyph should turn, but Button animates through a :before padded 3px left / 6px
		 * right, which puts the rotation center off the glyph unless the padding is evened to 4.5px
		 * each side — same 9px total, so the label does not shift when saving starts.
		 *
		 * TODO(@vanilla-bean/components > 2.0.1): replace with options.iconAnimation = 'spin' and
		 * delete this rule once a release carrying that option lands.
		 */
		.savingSpin:before {
			padding: 0 4.5px;
			animation: batchEditSavingSpin 1s linear infinite;
		}

		@keyframes batchEditSavingSpin {
			to {
				transform: rotate(1turn);
			}
		}
	`,
) {
	build() {
		this.modeIcon = new Icon({ appendTo: this, addClass: ['modeIcon'], icon: 'arrows-up-down-left-right' });

		this.labelElem = new Elem({ appendTo: this, addClass: ['label'] });

		this.modeToggle = new Elem({ appendTo: this, addClass: ['modeToggle'] });

		this.deleteModeButton = new Button({
			appendTo: this.modeToggle,
			textContent: 'Mark',
			icon: 'trash-can',
			tooltip: 'Click to mark bookmarks and categories for deletion',
			onPointerPress: () => this.options.modeChange?.('delete'),
		});

		this.paintModeButton = new Button({
			appendTo: this.modeToggle,
			textContent: 'Paint',
			icon: 'paintbrush',
			tooltip: 'Click to apply the brush color',
			onPointerPress: () => this.options.modeChange?.('paint'),
		});

		this.brush = new Elem({ appendTo: this, addClass: ['brush'] });

		this.customColorLabel = new Label({
			appendTo: this,
			addClass: ['customColor'],
			variant: 'collapsible',
			collapsed: true,
			label: 'Custom color',
		});

		this.colorPicker = new ColorPicker({
			appendTo: this.customColorLabel,
			value: this.options.brushColor,
			onChange: ({ value }) => this.options.colorChange?.(value),
		});

		this.refreshSwatches();

		this.countElem = new Elem({ appendTo: this, addClass: ['markedCount'] });

		this.doneButton = new Button({
			appendTo: this,
			textContent: 'Done',
			icon: 'check',
			onPointerPress: () => this.options.done?.(),
			styles: ({ colors }) => ({
				background: colors.green,
				color: colors.mostReadable(colors.green, [colors.white, colors.black]),
			}),
		});

		this.cancelButton = new Button({
			appendTo: this,
			textContent: 'Cancel',
			icon: 'xmark',
			onPointerPress: () => this.options.cancel?.(),
			styles: ({ colors }) => ({
				background: colors.gray,
				color: colors.mostReadable(colors.gray, [colors.white, colors.black]),
			}),
		});

		this._renderMode(this.options.mode);
		this._renderMarkedCount(this.options.markedCount);
		this._renderBrushColor(this.options.brushColor);
	}

	refreshSwatches() {
		this.brush.elem.replaceChildren();
		this.swatches = [];

		const addSwatch = (value, SwatchComponent, options) => {
			this.swatches.push({
				value,
				swatch: new SwatchComponent({
					appendTo: this.brush,
					onPointerPress: () => this.options.colorChange?.(value),
					...options,
				}),
			});
		};

		addSwatch('', ClearColorSwatch, {
			tooltip: 'Erase color — bookmarks fall back to their category, categories to the default',
			'aria-label': 'Erase color',
		});

		for (const color of getRecentColors()) {
			addSwatch(color, ColorSwatch, {
				tooltip: color,
				'aria-label': `Use ${color}`,
				style: {
					backgroundColor: color,
					color: theme.colors.mostReadable(color, [theme.colors.white, theme.colors.black]),
				},
			});
		}

		addSwatch('random', RandomColorSwatch, {
			tooltip: 'Random color — a new one on every click',
			'aria-label': 'Use a random color on every click',
		});

		this._renderBrushColor(this.options.brushColor);
	}

	_renderMode(mode) {
		const painting = mode === 'paint';

		this[painting ? 'addClass' : 'removeClass']('paintMode');

		this.modeIcon.options.icon = painting ? 'paintbrush' : 'arrows-up-down-left-right';
		this.labelElem.elem.textContent = painting
			? 'Paint Mode: click to apply the brush, drag to reorder or move'
			: 'Batch Edit Mode: click to mark for deletion, drag to reorder or move';

		this.deleteModeButton.options.disabled = !painting;
		this.paintModeButton.options.disabled = painting;
	}

	_renderMarkedCount(value) {
		this.countElem.elem.textContent = value > 0 ? `${value} marked for deletion` : '';
	}

	_renderBrushColor(color) {
		for (const { value, swatch } of this.swatches) {
			swatch[value === color ? 'addClass' : 'removeClass']('selected');
		}

		if (color && color !== 'random' && this.colorPicker.options.value !== color) {
			this.colorPicker.options.value = color;
		}
	}

	_renderSaving(saving) {
		this.doneButton.options.disabled = !!saving;
		this.cancelButton.options.disabled = !!saving;
		this.doneButton.options.textContent = saving ? 'Saving…' : 'Done';
		this.doneButton.options.icon = saving ? 'spinner' : 'check';
		this.doneButton[saving ? 'addClass' : 'removeClass']('savingSpin');
	}

	static schema = {
		mode: {
			default: 'delete',
			enum: ['delete', 'paint'],
			set(value) {
				if (this.modeIcon) this._renderMode(value);
			},
		},
		brushColor: {
			default: theme.colors.blue.toHslString(),
			set(value) {
				if (this.brush) this._renderBrushColor(value);
			},
		},
		markedCount: {
			set(value) {
				if (this.countElem) this._renderMarkedCount(value);
			},
		},
		saving: {
			set(value) {
				if (this.doneButton) this._renderSaving(value);
			},
		},
		modeChange: {},
		colorChange: {},
		done: {},
		cancel: {},
	};
}
