import { Elem, Button, Icon, Label, ColorPicker, styled, theme } from '@vanilla-bean/components';

import { ClearColorSwatch, BrushSwatch } from './swatches';
import { getRecentColors } from './util';

// A phone's width: the bar's controls share one line under the instructions
export const NARROW = '(max-width: 480px)';

export default class BatchEditBar extends styled.Component(
	({ colors, space, radius, fontSize }) => `
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: ${space.md};
		margin: ${space.md};
		padding: ${space.md} ${space.lg};
		border: 3px dashed ${colors.danger};
		background: ${colors.alpha(colors.danger, 0.14)};
		border-radius: ${radius.sm};
		box-shadow: 0 0 0 1px ${colors.alpha(colors.danger, 0.5)};

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
			font-size: ${fontSize.xxl};
			color: ${colors.light(colors.danger)};
		}

		.label {
			flex: 1;
			min-width: 220px;
			font-weight: bold;
			font-size: ${fontSize.md};
			text-transform: uppercase;
			letter-spacing: 0.03em;
			color: ${colors.superWhite};
		}

		.markedCount {
			font-weight: bold;
			color: ${colors.light(colors.danger)};
		}

		.modeToggle {
			display: flex;
			gap: ${space.xs};
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

		/* On a phone the instructions take the first line whole, and Mark, Paint, the count, Cancel and
		   Done share the next; the brush and custom color follow below them. */
		@media ${NARROW} {
			gap: ${space.sm};
			padding: ${space.sm} ${space.md};

			.label {
				flex: 1 1 calc(100% - 3em);
				min-width: 0;
			}

			.brush,
			.customColor {
				order: 1;
			}

			/* Cancel and Done keep to the line's end */
			.markedCount {
				margin-right: auto;
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

		// The safe way out first, then the main verb, the one filled button
		this.cancelButton = new Button({
			appendTo: this,
			textContent: 'Cancel',
			icon: 'xmark',
			variant: 'flat',
			onPointerPress: () => this.options.cancel?.(),
		});

		this.doneButton = new Button({
			appendTo: this,
			textContent: 'Done',
			icon: 'check',
			onPointerPress: () => this.options.done?.(),
		});

		this._renderMode(this.options.mode);
		this._renderMarkedCount(this.options.markedCount);
		this._renderBrushColor(this.options.brushColor);

		const narrow = window.matchMedia(NARROW);
		const fit = () => this._renderNarrow(narrow.matches);

		narrow.addEventListener('change', fit, { signal: this.signal });
		fit();
	}

	// Five controls fit a phone's line only small and in words alone, so there they drop their icons
	_renderNarrow(narrow) {
		this._narrow = narrow;

		for (const [button, icon] of [
			[this.deleteModeButton, 'trash-can'],
			[this.paintModeButton, 'paintbrush'],
			[this.cancelButton, 'xmark'],
		]) {
			button.setOptions({ size: narrow ? 'small' : undefined, icon: narrow ? undefined : icon });
		}

		this.doneButton.options.size = narrow ? 'small' : undefined;
		this._renderSaving(this.options.saving);
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
			addSwatch(color, BrushSwatch, { color, tooltip: color, 'aria-label': `Use ${color}` });
		}

		addSwatch('random', BrushSwatch, {
			color: 'random',
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

		this.deleteModeButton.options.pressed = !painting;
		this.paintModeButton.options.pressed = painting;
	}

	_renderMarkedCount(value) {
		this.countElem.elem.textContent = value > 0 ? `${value} marked` : '';
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
		// On a phone Done is words alone, but a save in progress still spins
		let icon = this._narrow ? undefined : 'check';

		if (saving) icon = 'spinner';

		this.doneButton.options.icon = icon;
		this.doneButton.options.iconAnimation = saving ? 'spin' : null;
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
