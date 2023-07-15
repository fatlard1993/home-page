const exit = {
	init() {
		process.on('exit', code => {
			console.error('EXIT', code);
		});

		process.on('SIGINT', () => {
			console.warn('Clean Exit');

			process.exit(130);
		});

		process.on('uncaughtException', error => {
			console.error('Uncaught Exception', error.stack);

			process.exit(99);
		});
	},
};

export default exit;
