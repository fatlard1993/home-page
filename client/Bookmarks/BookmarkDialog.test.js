import { findByRole, fireEvent, queryByRole, waitForElementToBeRemoved } from '@testing-library/dom';

import BookmarkDialog from './BookmarkDialog';

HTMLDialogElement.prototype.show = () => {
	this.open = true;
};

HTMLDialogElement.prototype.showModal = () => {
	this.open = true;
};

HTMLDialogElement.prototype.close = () => {
	this.open = false;
};

describe.skip('BookmarkDialog', () => {
	test('must provide a way to cancel the operation', async () => {
		new BookmarkDialog({ appendTo: container });

		fireEvent.click(await findByRole(container, 'button', { name: 'Cancel' }), {});

		await waitForElementToBeRemoved(() => queryByRole(container, 'dialog'));
	});
});
