import { findByRole, findAllByRole, fireEvent, queryByRole, waitForElementToBeRemoved } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

import CategoryDialog from './CategoryDialog';

const container = new JSDOM().window.document.body;

HTMLDialogElement.prototype.show = () => {
	this.open = true;
};

HTMLDialogElement.prototype.showModal = () => {
	this.open = true;
};

HTMLDialogElement.prototype.close = () => {
	this.open = false;
};

describe('CategoryDialog', () => {
	test('must render new category form', async () => {
		new CategoryDialog({ appendTo: container });

		await findByRole(container, 'textbox', { name: 'Name' });
	});

	test('must render edit category form', async () => {
		const category = {};

		new CategoryDialog({ category, appendTo: container });

		await findAllByRole(container, 'textbox');
	});

	test('must provide a way to cancel the operation', async () => {
		new CategoryDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});

		await waitForElementToBeRemoved(() => queryByRole(container, 'dialog'));
	});

	test.skip('must require a Name', async () => {
		new CategoryDialog({ appendTo: container });

		await findByRole(container, 'button', { name: 'Save' });

		await findByRole(container, 'textbox', { name: 'Name' });
	});
});
