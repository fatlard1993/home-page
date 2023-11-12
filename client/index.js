import process from 'process';
import { Page } from 'vanilla-bean-components';

import state from './state';
import router from './router';

import './hotReload';

window.process = process;

state.router = router;

document.addEventListener('keypress', event => {
	if (!state.searchElem) state.search += event.key;
	else if (event.key === '/' && document.activeElement !== state.searchElem) {
		event.preventDefault();
		state.searchElem.focus();
	}
});

new Page({
	styles: ({ colors }) => `
		color: ${colors.lightest(colors.gray)};
		background-color: ${colors.darkest(colors.gray)};
	`,
	appendTo: document.getElementById('app'),
	append: state.router,
});
