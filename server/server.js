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

		if (process.env.NODE_ENV === 'development') {
			const reloadClients = () => {
				Object.entries(clients).forEach(([clientId, socket]) => {
					console.log(`Reloading ${clientId}`);

					socket.send('hotReload');
				});
			};

			const spawnBuild = async () => {
				const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

				for await (const chunk of buildProcess.stdout) {
					const line = new TextDecoder().decode(chunk);

					console.log(line);

					if (line === 'build.success\n') reloadClients();
				}
			};

			await spawnBuild();
		}
	},
};
