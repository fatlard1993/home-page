import socketClient from 'socket-client';

const utils = {
	stayConnected() {
		if (socketClient.status === 'open') return;

		let reload = 'soft';

		if (reload === 'soft' && socketClient.triedSoftReload) reload = 'hard';

		socketClient.log()(`Reload: ${reload}`);

		if (reload === 'hard') return window.location.reload(false);

		socketClient.reconnect();

		socketClient.triedSoftReload = true;

		socketClient.resetSoftReset_TO = setTimeout(() => {
			socketClient.triedSoftReload = false;
		}, 4000);
	},
	isEditingText() {
		const activeElem = document.activeElement,
			activeNode = activeElem.nodeName;

		if (activeNode && (activeNode === 'textarea' || (activeNode === 'input' && activeElem.getAttribute('type') === 'text'))) return true;

		return false;
	},
};

export default utils;
