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

	// A bookmark marked for deletion says so as a pressed toggle, and marking it again keeps the same button (and focus)
	test('in batch mode a marked bookmark is pressed, and marking changes it in place', async () => {
		const bc = new BookmarksContainer({
			batchEdit: true,
			bookmarks: [
				{ id: 'one', name: 'one', url: 'one.com', markedForDeletion: true },
				{ id: 'two', name: 'two', url: 'two.com' },
			],
			label: 'heading',
			appendTo: container,
		});

		const one = await findByRole(container, 'button', { name: 'one', pressed: true });
		const two = getByRole(container, 'button', { name: 'two', pressed: false });

		bc.markBookmark('one', false);
		bc.markBookmark('two', true);

		expect(getByRole(container, 'button', { name: 'one', pressed: false })).toBe(one);
		expect(getByRole(container, 'button', { name: 'two', pressed: true })).toBe(two);
	});

	test("the category's name is a heading over its links", async () => {
		new BookmarksContainer({ bookmarks: [], label: 'Dev', categoryId: 'c1', appendTo: container });

		const heading = await findByRole(container, 'heading', { name: 'Dev' });

		expect(heading).not.toHaveAttribute('tabindex');
	});

	// In batch mode the name stays a plain heading; a toggle beside it, named with the category, marks it
	test('in batch mode a Mark button beside the name marks the category, pressed while marked', async () => {
		const tapped = [];

		const bc = new BookmarksContainer({
			batchEdit: true,
			bookmarks: [],
			label: 'Play',
			categoryId: 'c1',
			appendTo: container,
			onTapCategory: id => tapped.push(id),
		});

		const heading = await findByRole(container, 'heading', { name: 'Play' });
		const mark = getByRole(container, 'button', { name: 'Mark Play', pressed: false });

		expect(heading).not.toHaveAttribute('tabindex');

		heading.click();
		mark.click();

		expect(tapped).toEqual(['c1']);

		bc.options.categoryMarkedForDeletion = true;

		expect(getByRole(container, 'button', { name: 'Mark Play', pressed: true })).toBe(mark);
	});

	test('in paint mode the button paints the category instead, and is no toggle', async () => {
		const bc = new BookmarksContainer({
			batchEdit: true,
			bookmarks: [],
			label: 'Play',
			categoryId: 'c1',
			categoryMarkedForDeletion: true,
			appendTo: container,
		});

		const button = await findByRole(container, 'button', { name: 'Mark Play', pressed: true });

		bc.options.batchMode = 'paint';

		expect(button.textContent).toContain('Paint Play');
		expect(button).not.toHaveAttribute('aria-pressed');

		bc.options.batchMode = 'delete';

		expect(button).toHaveAttribute('aria-pressed', 'true');
	});

	test('the uncategorized group and a view outside batch mode have no category button', async () => {
		new BookmarksContainer({ batchEdit: true, bookmarks: [], label: 'Bookmarks', categoryId: '', appendTo: container });
		new BookmarksContainer({ bookmarks: [], label: 'Dev', categoryId: 'c1', appendTo: container });

		await findByRole(container, 'heading', { name: 'Dev' });

		expect(queryByRole(container, 'button')).toBeNull();
	});

	test('reflects post-construction option updates', async () => {
		const bc = new BookmarksContainer({
			batchEdit: true,
			categoryId: 'cat1',
			bookmarks: [{ id: 'one', name: 'test', url: 'test.com' }],
			label: 'heading',
			appendTo: container,
		});

		await findByRole(container, 'button', { name: 'test' });

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
