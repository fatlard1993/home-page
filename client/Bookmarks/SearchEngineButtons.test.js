import { describe, test, expect } from 'bun:test';
import { findByRole } from '@testing-library/dom';

import SearchEngineButtons from './SearchEngineButtons';

describe('SearchEngineButtons', () => {
	test('each engine is a small flat button that asks it once, not a chip: a one-off action, not a choice that stays on', async () => {
		const asked = [];
		const buttons = new SearchEngineButtons({
			appendTo: container,
			label: 'More Search Results',
			engines: [{ id: 'wiki', label: 'Wiki search results' }],
			onActivate: id => asked.push(id),
		});

		const wiki = await findByRole(container, 'button', { name: 'Wiki' });

		expect(wiki).toHaveClass('size-small');
		expect(wiki).toHaveClass('variant-flat');
		expect(wiki).not.toHaveAttribute('aria-pressed');

		wiki.click();

		expect(asked).toEqual(['wiki']);
		expect(buttons.heading.options.textContent).toBe('More Search Results');
	});
});
