import './index.css';

import DomElem from '../DomElem';

import Tag from '../Tag';
import { TextInput, IconButton } from '../inputs';

export default class TagList extends DomElem {
	constructor({ tags = [], readOnly = true, className, ...rest }) {
		let tagInput, addTag, addButton;

		if (!readOnly) {
			tagInput = new TextInput({ placeholder: 'New Tag' });
			addButton = new IconButton({
				icon: 'plus',
				onPointerPress: () => {
					const tags = Array.from(this.children).map(elem => elem.textContent);

					if (tagInput.value.length < 2 || tags.includes(tagInput.value)) return;

					new Tag({ appendTo: this, tag: tagInput.value });

					this.appendChild(addTag);

					tagInput.value = '';

					tagInput.focus();
				},
			});
			addTag = new Tag({
				readOnly: true,
				className: 'addTag',
				appendChildren: [tagInput, addButton],
			});
		}

		super('ul', { className: ['tagList', className], appendChildren: [...tags.map(tag => new Tag({ readOnly, tag })), ...(addTag ? [addTag] : [])], ...rest });

		this.tagInput = tagInput;
		this.addButton = addButton;
		this.addTag = addTag;
	}
}
