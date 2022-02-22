import socketClient from 'socket-client';
import dom from 'dom';

import { ModalDialog, Label, TextInput, Button, ColorPicker } from 'vanilla-bean-components';

export default class BookmarkDialog extends ModalDialog {
	constructor({ bookmark, ...rest }) {
		const nameInput = new TextInput({ label: 'Name' });
		const urlInput = new TextInput({ label: 'URL' });
		const colorPicker = new ColorPicker({ value: 'random' });
		const { label: colorLabel, value: color, set: setColor } = colorPicker;

		dom.appendChildren(colorLabel, [
			new Button({ textContent: 'Random', onPointerPress: () => setColor.apply(colorPicker, ['random']) }),
			...[
				// todo localstorage
				{ textContent: 'recent#1', color: '#666' },
				{ textContent: 'BADA55', color: '#bada55' },
			].map(({ textContent, color }) => new Button({ textContent, onPointerPress: () => setColor.apply(colorPicker, [color]) })),
		]);

		super({
			size: 'large',
			header: `${bookmark ? 'Edit' : 'Create'} Bookmark`,
			content: [new Label({ label: 'Name', appendChild: nameInput }), new Label({ label: 'URL', appendChild: urlInput }), colorLabel],
			buttons: ['Save', ...(bookmark ? ['Delete'] : []), 'Cancel'],
			onDismiss: ({ button, closeDialog }) => {
				if (button === 'Save') {
					// todo field validation & save
					socketClient.reply('bookmark_edit', { id: 'new', update: { name: nameInput.value, url: urlInput.value, color } });
				}

				closeDialog();
			},
			...rest,
		});
	}
}
