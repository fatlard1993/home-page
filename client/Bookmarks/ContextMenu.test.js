import ContextMenu from './ContextMenu';

describe('ContextMenu', () => {
	test('must render', async () => {
		const menu = new ContextMenu({ appendTo: container });

		// Menu is a popover — verify it mounted
		expect(menu.elem).toBeDefined();
		expect(menu.elem.getAttribute('popover')).toBe('manual');
	});

	// Placement is where the reticle gets built, so it is exercised directly rather than through
	// show() — showPopover has no behaviour to lean on in the test DOM.
	describe('reticle', () => {
		const place = (menu, x, y) => menu.edgeAwarePlacement({ x, y, maxHeight: 100, maxWidth: 240 });

		test('is centered on the click point', () => {
			const menu = new ContextMenu({ appendTo: container });

			place(menu, 100, 50);

			expect(document.body.contains(menu.contextPointer.elem)).toBe(true);
			// 32x28, so it backs off half of each — the box is not square and centring on the
			// width alone would sit it low.
			expect(menu.contextPointer.elem.style.left).toBe('84px');
			expect(menu.contextPointer.elem.style.top).toBe('36px');
		});

		test('never leaves the previous one behind', () => {
			const menu = new ContextMenu({ appendTo: container });

			place(menu, 100, 50);
			const first = menu.contextPointer.elem;

			place(menu, 200, 120);

			expect(document.body.contains(first)).toBe(false);
			expect(document.body.contains(menu.contextPointer.elem)).toBe(true);
			expect(menu.contextPointer.elem.style.left).toBe('184px');
		});
	});
});
