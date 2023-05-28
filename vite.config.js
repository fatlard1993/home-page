/// <reference types="vitest" />

import { defineConfig } from 'vite';

import { PORT } from './constants';

export default defineConfig({
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
