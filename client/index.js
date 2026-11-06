import { Page } from '@vanilla-bean/components';

import context from './context';
import router from './router';

import '@vanilla-bean/components/app/reloadOnBuild';

// Typing anywhere starts a search, except into a field, whose keys (a URL's slashes) are its own
const isTypingInField = target =>
	target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

document.addEventListener('keypress', event => {
	if (isTypingInField(event.target) && event.target !== context.searchElem) return;

	// Only a character is typing: Enter, Tab and the rest name themselves and would land as words
	if (!context.searchElem) context.preRenderSearch += event.key.length === 1 ? event.key : '';
	else if (event.key === '/' && document.activeElement !== context.searchElem) {
		event.preventDefault();
		context.searchElem.focus();
	}
});

new Page({ appendTo: document.body, append: router });
