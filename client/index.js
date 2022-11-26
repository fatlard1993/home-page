import './styles.css';

import { Page, Router } from 'vanilla-bean-components';

import { Bookmarks } from './Bookmarks';

import state from './state';

// dom.onLoad(() => {
// 	dom.interact.on('keyDown', utils.stayConnected);

// 	dom.interact.on('pointerDown', utils.stayConnected);

// 	document.oncontextmenu = evt => evt.preventDefault();

// 	document.addEventListener('visibilitychange', () => {
// 		if (document.visibilityState) utils.stayConnected();
// 	});
// });

const paths = { bookmarks: '/Bookmarks' };
const views = { [paths.bookmarks]: Bookmarks };

state.router = new Router({ views });

new Page({
	appendTo: document.getElementById('app'),
	appendChild: state.router,
});
