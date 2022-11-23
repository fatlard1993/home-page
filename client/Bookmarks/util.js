export const websiteRegex = /^(.+:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
export const ipRegex =
	/^(.+:\/\/)?(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?(\/.*)?$/;
export const hostnameRegex = /^(.+:\/\/)[^:]+?(:[0-9]{1,5})?(\/.*)?$/;
export const localhostRegex = /^(.+:\/\/)?localhost(:[0-9]{1,5})?(\/.*)?$/;

export const fixLink = url => {
	if (url.startsWith('file://')) url = url.replace('file://', `${window.location.href}load-file?file=`);
	else if (websiteRegex.test(url) || ipRegex.test(url) || localhostRegex.test(url) || hostnameRegex.test(url)) {
		if (!/.+:\/\//.test(url)) url = `http://${url}`;
	} else url = `http://google.com/search?q=${url}`;

	return url;
};
