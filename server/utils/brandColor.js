import { fetchBoundedHtml, ALLOWED_PROTOCOLS, FETCH_TIMEOUT, USER_AGENT } from './fetchHtml';
import { detectFaviconColor } from './faviconColor';

// Order-agnostic: these can declare their identifying attribute before or after `content`/`href`.
const THEME_COLOR_PATTERN =
	/<meta[^>]+(?:name=["']theme-color["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*name=["']theme-color["'])/i;
const TILE_COLOR_PATTERN =
	/<meta[^>]+(?:name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*name=["']msapplication-TileColor["'])/i;
const MANIFEST_LINK_PATTERN =
	/<link[^>]+(?:rel=["']manifest["'][^>]*href=["']([^"']+)["']|href=["']([^"']+)["'][^>]*rel=["']manifest["'])/i;
// Matches common theming variable names declared in an inline <style> block, e.g.
// --brand-color, --primary-colour, --color-accent, --theme-color.
const CSS_VAR_PATTERN =
	/--(?:(?:brand|primary|accent|theme)-?colou?r|colou?r-?(?:brand|primary|accent|theme))\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/i;

const extractAttr = (html, pattern) => {
	const match = html.match(pattern);

	return match?.[1] || match?.[2] || null;
};

const extractCssVarColor = html => {
	const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join('\n');

	return styleBlocks.match(CSS_VAR_PATTERN)?.[1] || null;
};

const fetchManifestThemeColor = async (href, baseUrl) => {
	let manifestUrl;

	try {
		manifestUrl = new URL(href, baseUrl);
	} catch {
		return null;
	}

	if (!ALLOWED_PROTOCOLS.includes(manifestUrl.protocol)) return null;

	try {
		const response = await fetch(manifestUrl, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT),
			headers: { 'User-Agent': USER_AGENT },
		});

		if (!response.ok) return null;

		const manifest = await response.json();

		return manifest?.theme_color || null;
	} catch {
		return null;
	}
};

// Tries, in order: the theme-color meta tag, a CSS theming variable, the web app manifest's
// theme_color, the Windows tile color meta tag, then — as a last resort, since it needs a
// second fetch and image decode — the favicon's color.
export const detectBrandColor = async url => {
	const page = await fetchBoundedHtml(url);

	if (!page) return null;

	const { html, baseUrl } = page;

	const themeColor = extractAttr(html, THEME_COLOR_PATTERN);
	if (themeColor) return themeColor;

	const cssVarColor = extractCssVarColor(html);
	if (cssVarColor) return cssVarColor;

	const manifestHref = extractAttr(html, MANIFEST_LINK_PATTERN);
	if (manifestHref) {
		const manifestColor = await fetchManifestThemeColor(manifestHref, baseUrl);
		if (manifestColor) return manifestColor;
	}

	const tileColor = extractAttr(html, TILE_COLOR_PATTERN);
	if (tileColor) return tileColor;

	return await detectFaviconColor(html, baseUrl);
};
