import { GET } from '@vanilla-bean/hypertether';

export const getBrandColor = async url =>
	GET('/brand-color', { searchParameters: { url }, cacheId: `brandColor:${url}` });
