import { GET } from '@vanilla-bean/components';

export const getBrandColor = async url =>
	GET('/brand-color', { searchParameters: { url }, cacheId: `brandColor:${url}` });
