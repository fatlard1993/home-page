import './styles/index.css';

import { Page, Router } from 'vanilla-bean-components';

import { Bookmarks } from './Bookmarks';

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

new Page({
	appendTo: document.getElementById('app'),
	appendChild: new Router({ views }),
	onRender: () => {
		console.log('Page Render');
	},
});
