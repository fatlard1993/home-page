import { hotReload } from '@vanilla-bean/components/app';

import router from './router';

export default {
	async init({ port }) {
		const server = Bun.serve({
			port,
			fetch: (request, server) => (hotReload.upgrade(request, server) ? undefined : router(request)),
			websocket: hotReload.websocket,
		});

		console.log(`Listening on ${server.hostname}:${server.port}`);

		if (process.env.NODE_ENV === 'development') await hotReload.watch();
	},
};
