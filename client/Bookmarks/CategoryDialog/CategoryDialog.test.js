import { findByRole, findAllByRole, fireEvent, queryByRole, waitForElementToBeRemoved } from '@testing-library/dom';

import CategoryDialog from './CategoryDialog';

HTMLDialogElement.prototype.show = () => {
	this.open = true;
};

HTMLDialogElement.prototype.showModal = () => {
	this.open = true;
};

HTMLDialogElement.prototype.close = () => {
	this.open = false;
};

describe.skip('CategoryDialog', () => {
	test('must provide a way to cancel the operation', async () => {
		new CategoryDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});

		await waitForElementToBeRemoved(() => queryByRole(container, 'dialog'));
	});

	test('must render new category form', async () => {
		new CategoryDialog({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
	});

	test('must render edit category form', async () => {
		const category = {};

		new CategoryDialog({ category, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test.skip('must require a Name', async () => {
		new CategoryDialog({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
	});
});
