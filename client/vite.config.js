import { defineConfig } from 'vite';

import { PORT } from '../constants';

export default defineConfig({
	server: {
		port: 9999,
		proxy: {
			'/bookmarks': `http://localhost:${PORT}`,
			'/search': `http://localhost:${PORT}`,
		},
	},
});
