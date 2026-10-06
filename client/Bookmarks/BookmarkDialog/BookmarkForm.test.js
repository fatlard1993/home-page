import { beforeAll, describe, test, expect } from 'bun:test';
import { findByRole, fireEvent, waitFor } from '@testing-library/dom';

import * as api from '../../api';
import BookmarkForm from './BookmarkForm';

// The preview endpoint's answer per url; anything unlisted is a site that never answered.
let previews;

beforeAll(() => {
	global.isSecureContext = true;

	// mock.module replaces the whole module process-wide; spreading the real exports keeps every
	// other api function intact for any test file that loads after this one.
	mock.module('../../api', () => ({
		...api,
		getCategories: async () => ({ body: {} }),
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
