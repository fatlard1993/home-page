import ContextMenu from './ContextMenu';

describe('ContextMenu', () => {
	test('must render', async () => {
		const menu = new ContextMenu({ appendTo: container });

		// Menu is a popover — verify it mounted
		expect(menu.elem).toBeDefined();
		expect(menu.elem.getAttribute('popover')).toBe('manual');
	});
});
