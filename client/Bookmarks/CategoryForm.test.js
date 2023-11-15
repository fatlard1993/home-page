import { findByRole, findAllByRole } from '@testing-library/dom';

import CategoryForm from './CategoryForm';

describe('CategoryForm', () => {
	test('must render new category form', async () => {
		new CategoryForm({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
	});

	test('must render edit category form', async () => {
		const category = {};

		new CategoryForm({ category, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test.skip('must require a Name', async () => {
		new CategoryForm({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
	});
});
