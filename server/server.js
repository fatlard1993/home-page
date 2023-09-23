import router from './router';

const clients = {};

export default {
	clients,
	async init({ port }) {
		const server = Bun.serve({
			port,
			fetch: router,
			...(process.env.NODE_ENV === 'development' && {
				websocket: {
					open(socket) {
						clients[socket.data.clientId] = socket;
					},
					close(socket) {
						delete clients[socket.data.clientId];
					},
				},
			}),
		});

		console.log(`Listening on ${server.hostname}:${server.port}`);
	},
};
