import { ModalDialog, Label, TextInput, Button, ColorPicker } from 'vanilla-bean-components';

import state from '../state';

export default class BookmarkDialog extends ModalDialog {
	constructor({ bookmark, ...rest }) {
		const nameInput = new TextInput({ label: 'Name', value: bookmark?.name });
		const urlInput = new TextInput({ label: 'URL', value: bookmark?.url });
		const colorPicker = new ColorPicker({
			label: 'Color',
			value: bookmark?.color || 'random',
			appendChildren: [
				new Button({ textContent: 'Random', onPointerPress: () => colorPicker.set('random') }),
				...[
					// todo localstorage
					{ textContent: 'recent#1', color: '#666' },
					{ textContent: 'BADA55', color: '#bada55' },
				].map(({ textContent, color }) => new Button({ textContent, onPointerPress: () => colorPicker.set(color) })),
			],
		});

		super({
			size: 'large',
			header: `${bookmark ? 'Edit' : 'Create'} Bookmark`,
			content: [new Label({ label: 'Name', appendChild: nameInput }), new Label({ label: 'URL', appendChild: urlInput }), colorPicker.label.elem],
			buttons: ['Save', ...(bookmark ? ['Delete'] : []), 'Cancel'],
			onButtonPress: ({ button, closeDialog }) => {
				if (button === 'Save') {
					// todo field validation

					fetch(bookmark ? `/bookmarks/${bookmark?.id}` : '/bookmarks', {
						method: bookmark ? 'PUT' : 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: nameInput.elem.value, url: urlInput.elem.value, color: colorPicker.value }),
					})
						.then(response => response.json())
						.then(data => {
							console.log('Success:', data);
							state.router.renderView();
						})
						.catch(error => {
							console.error('Error:', error);
						});
				} else if (button === 'Delete') {
					fetch(`/bookmarks/${bookmark.id}`, {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
					})
						.then(response => response.json())
						.then(data => {
							console.log('Success:', data);
							state.router.renderView();
						})
						.catch(error => {
							console.error('Error:', error);
						});
				}

				closeDialog();
			},
			...rest,
		});
	}
}
