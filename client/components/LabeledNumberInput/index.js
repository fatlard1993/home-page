import dom from 'dom';

import Label from '../Label';
import { NumberInput } from '../inputs';

export default class LabeledNumberInput {
	constructor({ label, appendTo, ...rest }) {
		this.label = new Label({ label, appendTo });
		this.numberInput = new NumberInput({ appendTo: this.label, ...rest });

		return this;
	}

	cleanup() {
		dom.remove(this.label);
	}
}
