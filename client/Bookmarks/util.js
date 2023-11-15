const websiteRegex = /^(.+:\/\/)?[\da-z]+([.-][\da-z]+)*\.[a-z]{2,5}(:\d{1,5})?(\/.*)?$/;
const ipRegex = /^(.+:\/\/)?(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})(:\d{1,5})?(\/.*)?$/;
const hostnameRegex = /^(.+:\/\/)[^:]+?(:\d{1,5})?(\/.*)?$/;
const localhostRegex = /^(.+:\/\/)?localhost(:\d{1,5})?(\/.*)?$/;

export const isLink = url => websiteRegex.test(url) || ipRegex.test(url) || localhostRegex.test(url) || hostnameRegex.test(url);

export const fixLink = url => (isLink(url) && !/.+:\/\//.test(url) ? `http://${url}` : `http://google.com/search?q=${url}`);

export const copyToClipboard = text => {
	if (!isSecureContext) return false;

	navigator.clipboard.writeText(text);

	return true;
};
