import process from 'process';
import { Page } from 'vanilla-bean-components';

import state from './state';
import router from './router';

window.process = process;

state.router = router;

new Page({
	styles: ({ colors }) => `
		color: ${colors.lightest(colors.gray)};
		background-color: ${colors.darkest(colors.gray)};
	`,
	appendTo: document.getElementById('app'),
	append: state.router,
});
