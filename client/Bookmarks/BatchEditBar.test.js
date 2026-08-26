import { beforeEach, describe, test, expect } from 'bun:test';

import BatchEditBar from './BatchEditBar';

describe('BatchEditBar', () => {
	beforeEach(() => localStorage.clear());

	test('must render', () => {
		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.elem).toBeDefined();
		expect(bar.doneButton).toBeDefined();
		expect(bar.colorPicker).toBeDefined();
	});

	// The paintMode class is the whole contract: what each mode shows, hides and recolors hangs off
	// it in CSS, so that is what these assert rather than computed styles the test DOM never applies.
	test('starts in delete mode', () => {
		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.hasClass('paintMode')).toBe(false);
		expect(bar.labelElem.elem.textContent).toContain('mark for deletion');
	});

	test('paint mode switches the bar over', () => {
		const bar = new BatchEditBar({ appendTo: container, mode: 'paint' });

		expect(bar.hasClass('paintMode')).toBe(true);
		expect(bar.labelElem.elem.textContent).toContain('apply the brush');
	});

	test('the brush and custom picker sit under the class that reveals them', () => {
		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.brush.hasClass('brush')).toBe(true);
		expect(bar.customColorLabel.hasClass('customColor')).toBe(true);
		expect(bar.countElem.hasClass('markedCount')).toBe(true);
	});

	test('the mode buttons report the mode they switch to', () => {
		const modes = [];
		const bar = new BatchEditBar({ appendTo: container, modeChange: mode => modes.push(mode) });

		bar.paintModeButton.options.onPointerPress();
		bar.deleteModeButton.options.onPointerPress();

		expect(modes).toEqual(['paint', 'delete']);
	});

	test('the active mode button is the disabled one', () => {
		const bar = new BatchEditBar({ appendTo: container, mode: 'paint' });

		expect(bar.paintModeButton.elem.disabled).toBe(true);
		expect(bar.deleteModeButton.elem.disabled).toBe(false);
	});

	test('offers a swatch per remembered color, plus erase and random', () => {
		localStorage.setItem('recentColors', JSON.stringify(['hsl(1, 1%, 1%)', 'hsl(2, 2%, 2%)']));

		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.swatches.map(({ value }) => value)).toEqual(['', 'hsl(1, 1%, 1%)', 'hsl(2, 2%, 2%)', 'random']);
	});

	test('a corrupt recentColors store renders an empty swatch row instead of throwing', () => {
		// The bar is built during page render, so a bad store must not take the whole page down.
		localStorage.setItem('recentColors', '{not json');

		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.swatches.map(({ value }) => value)).toEqual(['', 'random']);
	});

	test('non-color members in the store are skipped', () => {
		localStorage.setItem('recentColors', JSON.stringify([null, 5, 'hsl(1, 1%, 1%)']));

		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.swatches.map(({ value }) => value)).toEqual(['', 'hsl(1, 1%, 1%)', 'random']);
	});

	test('a swatch press reports its color', () => {
		localStorage.setItem('recentColors', JSON.stringify(['hsl(1, 1%, 1%)']));

		const picked = [];
		const bar = new BatchEditBar({ appendTo: container, colorChange: color => picked.push(color) });

		for (const { swatch } of bar.swatches) swatch.options.onPointerPress();

		expect(picked).toEqual(['', 'hsl(1, 1%, 1%)', 'random']);
	});

	test('marks the swatch matching the loaded brush', () => {
		localStorage.setItem('recentColors', JSON.stringify(['hsl(1, 1%, 1%)', 'hsl(2, 2%, 2%)']));

		const bar = new BatchEditBar({ appendTo: container, brushColor: 'hsl(2, 2%, 2%)' });
		const selected = () => bar.swatches.filter(({ swatch }) => swatch.hasClass('selected')).map(({ value }) => value);

		expect(selected()).toEqual(['hsl(2, 2%, 2%)']);

		bar.options.brushColor = '';

		expect(selected()).toEqual(['']);
	});

	test('a custom color that matches no swatch still reaches the picker', () => {
		const bar = new BatchEditBar({ appendTo: container });

		bar.options.brushColor = 'hsl(300, 40%, 40%)';

		expect(bar.swatches.some(({ swatch }) => swatch.hasClass('selected'))).toBe(false);
		expect(bar.colorPicker.options.value).toBe('hsl(300, 40%, 40%)');
	});

	test("the picker's own value echoed back is not written to it again", () => {
		// Writing the picker's emitted value back would re-enter its change handler.
		const bar = new BatchEditBar({ appendTo: container });
		const picker = bar.colorPicker;

		let writes = 0;

		bar.colorPicker = {
			options: {
				get value() {
					return picker.options.value;
				},
				set value(color) {
					writes++;
					picker.options.value = color;
				},
			},
		};

		bar.options.brushColor = picker.options.value;
		expect(writes).toBe(0);

		bar.options.brushColor = 'hsl(210, 30%, 30%)';
		expect(writes).toBe(1);
	});

	test('the custom picker starts collapsed so the bar stays one row', () => {
		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.customColorLabel.hasClass('collapsed')).toBe(true);
	});

	test('saving disables both buttons and says so', () => {
		const bar = new BatchEditBar({ appendTo: container });

		bar.options.saving = true;

		expect(bar.doneButton.elem.disabled).toBe(true);
		expect(bar.cancelButton.elem.disabled).toBe(true);
		expect(bar.doneButton.options.textContent).toBe('Saving…');

		bar.options.saving = false;

		expect(bar.doneButton.elem.disabled).toBe(false);
		expect(bar.doneButton.options.textContent).toBe('Done');
	});

	// Button is itself an Icon, so fa-spin turned the entire control rather than the glyph. The
	// spin belongs to a class the bar's own CSS points at the :before, never to the fa animation.
	test('saving spins the glyph without putting fa-spin on the button', () => {
		const bar = new BatchEditBar({ appendTo: container });

		bar.options.saving = true;

		expect(bar.doneButton.hasClass('savingSpin')).toBe(true);
		expect(bar.doneButton.hasClass('fa-spin')).toBe(false);

		bar.options.saving = false;

		expect(bar.doneButton.hasClass('savingSpin')).toBe(false);
	});

	test('reports the marked count', () => {
		const bar = new BatchEditBar({ appendTo: container, markedCount: 3 });

		expect(bar.countElem.elem.textContent).toBe('3 marked for deletion');

		bar.options.markedCount = 0;

		expect(bar.countElem.elem.textContent).toBe('');
	});

	test('starts with a real color loaded, not the eraser', () => {
		const bar = new BatchEditBar({ appendTo: container });

		expect(bar.options.brushColor).not.toBe('');
		expect(bar.colorPicker.options.value).toBe(bar.options.brushColor);
	});

	// Sizing, spacing and the selected outline all live in the shared base's generated class. Each
	// variant adds its own on top, so every swatch must carry the base's — a variant built straight
	// on Button would render a different size and show nothing when it was the one loaded.
	test('every swatch is built on the shared base, whatever variant it wears', () => {
		localStorage.setItem('recentColors', JSON.stringify(['hsl(1, 1%, 1%)']));

		const bar = new BatchEditBar({ appendTo: container, brushColor: '' });
		const stylingClasses = ({ swatch }) => [...swatch.elem.classList].filter(name => name !== swatch.uniqueId);

		// The plain recent-color swatch is the base wearing no variant.
		const baseClasses = stylingClasses(bar.swatches[1]);

		expect(baseClasses.length).toBeGreaterThan(0);

		for (const entry of bar.swatches) {
			const missing = baseClasses.filter(name => !stylingClasses(entry).includes(name));

			expect(missing).toEqual([]);
		}
	});

	test('the erase swatch shows when it is the one loaded', () => {
		const bar = new BatchEditBar({ appendTo: container, brushColor: '' });
		const [erase] = bar.swatches;

		expect(erase.value).toBe('');
		expect(erase.swatch.hasClass('selected')).toBe(true);
	});
});
