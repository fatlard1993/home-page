const buildClassList = (...classNames) => {
	return [...new Set(classNames.flat(Infinity).filter(className => typeof className === 'string' && className.length))];
};

const buildClassName = (...classNames) => {
	return buildClassList(...classNames).join(' ');
};

export { buildClassList, buildClassName };
