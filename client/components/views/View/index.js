import './index.css';

import dom from 'dom';

import DomElem from '../../DomElem';

export default class View {
	constructor(options) {
		if (options) this.render(options);
	}

	render({ className, ...rest }) {
		this.cleanup();

		this.elem = new DomElem('div', { className: ['view', className], ...rest });
	}

	cleanup() {
		if (this.elem) dom.remove(this.elem);
	}
}
