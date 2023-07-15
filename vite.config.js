/// <reference types="vitest" />

import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

import { PORT } from './constants';

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
	plugins: [
		legacy({
			modernPolyfills: true,
		}),
	],
	server: {
		open: '/client/index.html',
		port: 9999,
		proxy: {
			'/bookmarks': `http://localhost:${PORT}`,
			'/search': `http://localhost:${PORT}`,
		},
	},
	test: {
		include: ['**/*.test.js'],
		environment: 'jsdom',
		globals: true,
		deps: {
			inline: ['vanilla-bean-components'],
		},
	},
	resolve: {
		alias: {
			process: 'process/browser',
			path: 'node_modules/@jspm/core/nodelibs/browser/path.js',
			url: 'node_modules/@jspm/core/nodelibs/browser/url.js',
			fs: 'node_modules/@jspm/core/nodelibs/browser/fs.js',
			'source-map-js': 'node_modules/source-map-js/source-map.js',
		},
	},
});
