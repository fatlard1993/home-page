const exit = {
	init() {
		process.on('exit', code => {
			console.error('EXIT', code);
		});

		process.on('SIGINT', () => {
			console.warn('Clean Exit');

			process.exit(130);
		});

		process.on('uncaughtException', err => {
			console.error('Uncaught Exception', err.stack);

			process.exit(99);
		});
	},
};

export default exit;
