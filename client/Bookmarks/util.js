const websiteRegex = /^(.+:\/\/)?[\da-z]+([.-][\da-z]+)*\.[a-z]{2,5}(:\d{1,5})?(\/.*)?$/;
const ipRegex =
	/^(.+:\/\/)?(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})(:\d{1,5})?(\/.*)?$/;
const hostnameRegex = /^(.+:\/\/)[^:]+?(:\d{1,5})?(\/.*)?$/;
const localhostRegex = /^(.+:\/\/)?localhost(:\d{1,5})?(\/.*)?$/;

export const isLink = url =>
	websiteRegex.test(url) || ipRegex.test(url) || localhostRegex.test(url) || hostnameRegex.test(url);

export const saveRecentColor = color => {
	if (!color || color === 'random') return;

	const recentColors = [...new Set([color, ...(JSON.parse(localStorage.getItem('recentColors')) || [])])];
	recentColors.length = Math.min(recentColors.length, 10);
	localStorage.setItem('recentColors', JSON.stringify(recentColors));
};

export const validateForm = form => {
	document.activeElement?.blur();
	return form.hasErrors();
};

export const fixLink = url => {
	if (isLink(url)) return /.+:\/\//.test(url) ? url : `http://${url}`;

	return `http://google.com/search?q=${encodeURIComponent(url)}`;
};
