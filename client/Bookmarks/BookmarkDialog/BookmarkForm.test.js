import { beforeAll, describe, test, expect } from 'bun:test';
import { findByRole, fireEvent, waitFor } from '@testing-library/dom';

import * as api from '../../api';
import BookmarkForm from './BookmarkForm';

// The preview endpoint's answer per url; anything unlisted is a site that never answered.
let previews;
let categoriesResult = { body: {} };

beforeAll(() => {
	global.isSecureContext = true;

	// mock.module replaces the whole module process-wide; spreading the real exports keeps every
	// other api function intact for any test file that loads after this one.
	mock.module('../../api', () => ({
		...api,
		getCategories: async () => categoriesResult,
		getBrandColor: async () => ({ body: {} }),
		getFaviconPreview: async url => ({ body: previews[url] ?? { status: 'unreachable', dataUri: null } }),
	}));
});

const FOUND = { status: 'found', dataUri: 'data:image/png;base64,iVBORw0KGgo=' };
const NONE = { status: 'none', dataUri: null };

const render = async (options = {}) => {
	const form = new BookmarkForm({ appendTo: container, ...options });
	const checkbox = await findByRole(container, 'checkbox', { name: 'Use site favicon' });

	return { form, checkbox };
};

const typeUrl = (form, url) => {
	form.inputElements.url.elem.value = url;
	fireEvent.input(form.inputElements.url.elem);
};

// Detection is debounced behind typing, so assertions wait for it to land.
const settled = assertion => waitFor(assertion, { timeout: 2000 });

describe('BookmarkForm favicon detection', () => {
	test('a page with no favicon unchecks and disables the box', async () => {
		previews = { 'http://iconless.test': NONE };
		const { form, checkbox } = await render();

		fireEvent.click(checkbox);
		expect(checkbox.checked).toBe(true);

		typeUrl(form, 'http://iconless.test');

		await settled(() => expect(checkbox.disabled).toBe(true));
		expect(checkbox.checked).toBe(false);
		expect(form.useFavicon).toBe(false);
	});

	test('moving on to a url that has one hands the choice back', async () => {
		previews = { 'http://iconless.test': NONE, 'http://iconic.test': FOUND };
		const { form, checkbox } = await render();

		fireEvent.click(checkbox);
		typeUrl(form, 'http://iconless.test');
		await settled(() => expect(checkbox.disabled).toBe(true));

		typeUrl(form, 'http://iconic.test');

		await settled(() => expect(checkbox.disabled).toBe(false));
		expect(checkbox.checked).toBe(true);
		expect(form._pendingFaviconDataUri).toBe(FOUND.dataUri);
	});

	test('an unreachable site leaves the box alone', async () => {
		previews = {};
		const { form, checkbox } = await render();

		fireEvent.click(checkbox);
		typeUrl(form, 'http://down.test');

		await settled(() => expect(form._siteFaviconStatus).toBe('unreachable'));
		expect(checkbox.disabled).toBe(false);
		expect(checkbox.checked).toBe(true);
	});

	test('a saved favicon keeps the box usable when the site no longer has one', async () => {
		previews = { 'http://iconless.test': NONE };
		const { form, checkbox } = await render({
			data: { id: 'b1', name: 'saved', url: 'http://iconless.test', favicon: 'image/png' },
		});

		await settled(() => expect(form._siteFaviconStatus).toBe('none'));
		expect(checkbox.disabled).toBe(false);
		expect(checkbox.checked).toBe(true);
		// Keeping the box checked is what stops BookmarkDialog deleting the saved icon on save.
		expect(form.useFavicon).toBe(true);
	});

	test('an upload keeps the box usable on a url with no favicon', async () => {
		previews = { 'http://iconless.test': NONE };
		const { form, checkbox } = await render();

		form.wantsFavicon = true;
		form._setPendingFavicon('data:image/png;base64,upload', { uploaded: true });
		typeUrl(form, 'http://iconless.test');

		await settled(() => expect(form._siteFaviconStatus).toBe('none'));
		expect(checkbox.disabled).toBe(false);
		expect(form._pendingFaviconDataUri).toBe('data:image/png;base64,upload');
	});
});

describe('BookmarkForm favicon label', () => {
	test('the Use site favicon checkbox has its label after it, on its line', async () => {
		const { form } = await render();

		expect(form.faviconLabel.hasClass('variant-inline-after')).toBe(true);
	});
});

describe('BookmarkForm categories', () => {
	test('choosing New shows a name field; Default and an existing category hide it again', async () => {
		categoriesResult = { body: { c1: { id: 'c1', name: 'Dev' } } };

		try {
			const { form } = await render();
			const row = form.inputElements.newCategory.parent.elem;

			await settled(() => expect(form._categoriesById).toBeDefined());
			expect(row.style.display).toBe('none');

			form.options.data.category = form.uniqueId;
			expect(row.style.display).toBe('');
			expect(form.creatingCategory).toBe(true);
			// A declared field: its Label names it, and it takes the focus as it appears
			expect(await findByRole(container, 'textbox', { name: 'New Category' })).toHaveFocus();

			form.options.data.category = 'c1';
			expect(row.style.display).toBe('none');
			expect(form.chosenCategory).toBe('c1');

			form.options.data.category = 'Default';
			expect(form.chosenCategory).toBe('');
		} finally {
			categoriesResult = { body: {} };
		}
	});

	test('a New category needs a name, and saves as one to create', async () => {
		const { form } = await render({ data: { name: 'Docs', url: 'http://docs.test' } });

		form.options.data.category = form.uniqueId;
		expect(form.hasErrors()).toBe(true);

		form.options.data.newCategory = 'Work';
		expect(form.hasErrors()).toBe(false);
		expect(form.chosenCategory).toEqual({ create: { name: 'Work' } });
	});

	test('a name still being typed when Enter saves is taken as it stands', async () => {
		const { form } = await render({ data: { name: 'Docs', url: 'http://docs.test' } });

		form.options.data.category = form.uniqueId;
		form.inputElements.newCategory.elem.focus();
		form.inputElements.newCategory.elem.value = 'Work';

		expect(form.hasErrors()).toBe(false);
		expect(form.chosenCategory).toEqual({ create: { name: 'Work' } });
	});

	test('the reserved names stay refused', async () => {
		const { form } = await render({ data: { name: 'Docs', url: 'http://docs.test' } });

		form.options.data.category = form.uniqueId;
		form.options.data.newCategory = 'Default';

		expect(form.hasErrors()).toBe(true);
	});

	test('a refused category list leaves Default and New, and says why', async () => {
		categoriesResult = { status: 'error', body: { error: 'Database busy' } };

		try {
			const { form } = await render();

			await settled(() => expect(document.body.textContent).toContain('Could not load the categories: Database busy'));
			expect(form.inputElements.category.options.options.map(option => option.label ?? option)).toEqual([
				'Default',
				'New',
			]);
		} finally {
			categoriesResult = { body: {} };
		}
	});
});
