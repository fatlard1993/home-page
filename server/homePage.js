import express from 'express';
import WebsocketServer from 'websocket-server';

import { port } from '../constants.js';
import database from './database.js';
import router from './router.js';
import socketEndpoints from './socketEndpoints.js';

const homePage = {
	init({ log, options }) {
		const app = express();
		const server = app.listen(port, () => log(`Server listening on port: ${port}`));
		const socketServer = new WebsocketServer({ server });

		router.init({ express, app });
		socketEndpoints.init({ log, socketServer });
		database.init({ persistent: options.persistent, path: options.database });
	},
};

export default homePage;
