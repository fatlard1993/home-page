import dom from 'dom';

import Label from '../Label';
import DomElem from '../DomElem';

export default class LabeledElem {
	constructor(nodeName, { label, appendTo, ...options }) {
		this.label = new Label({ label, appendTo });
		this.elem = new DomElem(nodeName, { ...options, appendTo: this.labelElem });

		return this;
	}

	cleanup() {
		dom.remove(this.label);
	}
}
