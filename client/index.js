import process from 'process';
import { Page, Router } from 'vanilla-bean-components';

import { Bookmarks } from './Bookmarks';

import state from './state';

window.process = process;

const paths = { bookmarks: '/Bookmarks' };
const views = { [paths.bookmarks]: Bookmarks };

state.router = new Router({ views });

new Page({
	styles: ({ colors }) => `
		color: ${colors.lightest(colors.gray)};
		background-color: ${colors.darkest(colors.gray)};
	`,
	appendTo: document.getElementById('app'),
	appendChild: state.router,
});
