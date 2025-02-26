import process from 'process';
import { Page } from 'vanilla-bean-components';

import context from './context';
import router from './router';

import './hotReload';

window.process = process;

document.addEventListener('keypress', event => {
	if (!context.searchElem) context.preRenderSearch += event.key;
	else if (event.key === '/' && document.activeElement !== context.searchElem) {
		event.preventDefault();
		context.searchElem.focus();
	}
});

new Page({ appendTo: document.body, append: router });
