import { findByRole, queryByRole } from '@testing-library/dom';

import BookmarksContainer from './BookmarksContainer';

describe('BookmarksContainer', () => {
	test('must render with bookmarks', async () => {
		const bc = new BookmarksContainer({
			bookmarks: [{ name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
		});

		await findByRole(container, 'link');

		expect(bc.elem).toBeDefined();
	});

	test('renders bookmarks as real links outside batch mode', async () => {
		new BookmarksContainer({
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
		});

		const link = await findByRole(container, 'link');

		expect(link.getAttribute('href')).toBe('http://test.com');
		expect(queryByRole(container, 'button')).toBeNull();
	});

	test('renders bookmarks as toggle buttons in batch mode', async () => {
		const toggled = [];

		new BookmarksContainer({
			batchEdit: true,
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
			onToggleBookmark: id => toggled.push(id),
		});

		const button = await findByRole(container, 'button');

		expect(button.getAttribute('href')).toBeNull();
		expect(queryByRole(container, 'link')).toBeNull();

		button.click();

		expect(toggled).toEqual(['one']);
	});

	test('reflects post-construction option updates', async () => {
		const bc = new BookmarksContainer({
			batchEdit: true,
			categoryId: 'cat1',
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
		});

		await findByRole(container, 'button');

		expect(bc.elem.classList.contains('categoryMarked')).toBe(false);

		bc.options.categoryMarkedForDeletion = true;

		expect(bc.elem.classList.contains('categoryMarked')).toBe(true);
	});
});
