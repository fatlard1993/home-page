const utils = {
	isEditingText() {
		const activeElem = document.activeElement,
			activeNode = activeElem.nodeName;

		if (activeNode && (activeNode === 'textarea' || (activeNode === 'input' && activeElem.getAttribute('type') === 'text'))) return true;

		return false;
	},
};

export default utils;
