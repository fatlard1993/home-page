import dom from 'dom';

import Label from '../Label';
import { Textarea } from '../inputs';

export default class LabeledTextarea {
	constructor({ label, value = '', appendTo, ...rest }) {
		const initialValue = value;

		this.label = new Label({ label, appendTo });
		this.textarea = new Textarea({ appendTo: this.label, ...rest, value });

		this.textarea.isDirty = () => initialValue !== this.textarea.value;

		return this;
	}

	cleanup() {
		dom.remove(this.label);
	}
}
