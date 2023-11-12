import { findByRole } from '@testing-library/dom';

import ContextMenu from './ContextMenu';

describe('ContextMenu', () => {
	test('must render', async () => {
		new ContextMenu({ appendTo: container });

		await findByRole(container, 'list');
	});
});
