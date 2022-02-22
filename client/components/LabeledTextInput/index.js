import dom from 'dom';

import Label from '../Label';
import { TextInput } from '../inputs';

export default class LabeledTextInput {
	constructor({ label, appendTo, ...rest }) {
		this.label = new Label({ label, appendTo });
		this.textInput = new TextInput({ appendTo: this.label, ...rest });

		return this;
	}

	cleanup() {
		dom.remove(this.label);
	}
}
