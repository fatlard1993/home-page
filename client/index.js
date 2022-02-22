import './styles/index.css';

import dom from 'dom';
import socketClient from 'socket-client';

import { port } from '../constants.js';
import utils from './utils';
import router from './router';

dom.onLoad(() => {
	dom.mobile.detect();

	socketClient.init('/api', port);

	dom.interact.on('keyDown', utils.stayConnected);

	dom.interact.on('pointerDown', utils.stayConnected);

	router.init();

	document.oncontextmenu = evt => evt.preventDefault();

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState) utils.stayConnected();
	});
});
