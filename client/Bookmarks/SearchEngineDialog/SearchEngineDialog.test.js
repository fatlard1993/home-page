import { findByRole } from '@testing-library/dom';

import SearchEngineDialog from './SearchEngineDialog';

describe('SearchEngineDialog', () => {
	const engine = { id: 'e1', label: 'Wiki', url: 'https://w.test/?q=:term', resultsPath: 'items' };

	test('the stored { property, direction } order fills the Order By and Direction fields', async () => {
		const dialog = new SearchEngineDialog({
			engine: { ...engine, orderBy: { property: 'url', direction: 'desc' } },
			appendTo: container,
		});

		await findByRole(container, 'dialog', { hidden: true });

		expect(dialog.form.inputElements.orderByProperty.elem.value).toBe('url');
		expect(dialog.form.inputElements.orderByDirection.elem.value).toBe('desc');
	});

	test('an engine written by hand with a bare field name is read the same way', async () => {
		const dialog = new SearchEngineDialog({ engine: { ...engine, orderBy: 'name' }, appendTo: container });

		await findByRole(container, 'dialog', { hidden: true });

		expect(dialog.form.inputElements.orderByProperty.elem.value).toBe('name');
		expect(dialog.form.inputElements.orderByDirection.elem.value).toBe('asc');
	});

	// mock.module is process-wide, so the real api goes back once this test is done with it
	test('saving folds the two fields back into one orderBy, and sends nothing else for them', async () => {
		const real = { ...(await import('../../api')) };
		let sent;

		mock.module('../../api', () => ({
			...real,
			updateSearchEngine: async (id, { body }) => {
				sent = { id, body };

				return { status: 'success', body: { id, ...body } };
			},
		}));

		try {
			const dialog = new SearchEngineDialog({ engine: { ...engine, orderBy: 'name' }, appendTo: container });

			await findByRole(container, 'dialog', { hidden: true });

			dialog.form.options.data.orderByProperty = 'url';
			dialog.form.options.data.orderByDirection = 'desc';

			expect(await dialog.save()).toBe(true);
			expect(sent.id).toBe('e1');
			expect(sent.body.orderBy).toEqual({ property: 'url', direction: 'desc' });
			expect('orderByProperty' in sent.body).toBe(false);
			expect('orderByDirection' in sent.body).toBe(false);
		} finally {
			mock.module('../../api', () => real);
		}
	});
});
