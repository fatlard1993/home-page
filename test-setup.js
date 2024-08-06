/// <reference lib="dom" />

import { beforeEach, mock } from 'bun:test';

// import * as matchers from '@testing-library/jest-dom/matchers';

import { GlobalRegistrator } from '@happy-dom/global-registrator';

// expose mock
// - wasn't available otherwise and importing in the test files that need mocks breaks the rest of the file
global.mock = mock;

GlobalRegistrator.register();

// Expose EventTarget for Context
global.EventTarget = (await import('happy-dom')).EventTarget;

// expect.extend(matchers);

global.container = document.body;

beforeEach(() => document.body.replaceChildren());
