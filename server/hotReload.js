import server from './server';

if (process.env.NODE_ENV === 'development') {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:dev']);
	const reader = buildProcess.stdout.getReader();

	const handleBuildChange = () => {
		Object.entries(server.clients).forEach(([clientId, socket]) => {
			console.log(`Reloading ${clientId}`);

			socket.send('hotReload');
		});

		reader.read().then(handleBuildChange).catch(console.error);
	};

	handleBuildChange();
}
