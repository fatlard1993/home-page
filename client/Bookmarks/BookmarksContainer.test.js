import { findByRole, queryByRole, getByRole, fireEvent } from '@testing-library/dom';

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

	test('renders bookmarks as tappable buttons in batch mode', async () => {
		const tapped = [];

		new BookmarksContainer({
			batchEdit: true,
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
			onTapBookmark: id => tapped.push(id),
		});

		const button = await findByRole(container, 'button');

		expect(button.getAttribute('href')).toBeNull();
		expect(queryByRole(container, 'link')).toBeNull();

		button.click();

		expect(tapped).toEqual(['one']);
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

describe('BookmarksContainer favicons', () => {
	test('a favicon that fails to load is removed, leaving the name', async () => {
		new BookmarksContainer({
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com', favicon: 'image/png' }],
			label: 'heading',
			appendTo: container,
		});

		const link = await findByRole(container, 'link');
		const img = getByRole(link, 'img');

		expect(img.getAttribute('src')).toBe('/bookmarks/one/favicon');

		fireEvent.error(img);

		expect(queryByRole(link, 'img')).toBeNull();
		expect(link.textContent).toBe('test');
	});
});
