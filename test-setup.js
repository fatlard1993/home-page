/// <reference lib="dom" />

import { beforeEach } from 'bun:test';

// import * as matchers from '@testing-library/jest-dom/matchers';

import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// expect.extend(matchers);

global.container = document.body;

beforeEach(() => document.body.replaceChildren());
