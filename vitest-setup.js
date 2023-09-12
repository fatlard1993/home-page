// https://github.com/testing-library/jest-dom#table-of-contents
import '@testing-library/jest-dom/vitest';

const container = document.body;

beforeAll(() => (global.container = container));

beforeEach(() => container.replaceChildren());
