import './index.css';

import socketClient from 'socket-client';

import { TextInput } from 'vanilla-bean-components';

export default class Search extends TextInput {
	constructor({ className, ...rest } = {}) {
		super({
			className: ['search', className],
			placeholder: 'Search',
			onKeyUp: ({ key }) => {
				// todo debounced search

				if (key === 'Enter') {
					// todo search
					socketClient.reply('search', this.value);
				}
			},
			...rest,
		});
	}
}
