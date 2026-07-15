import { PNG } from 'pngjs';

import { fetchBoundedHtml, ALLOWED_PROTOCOLS, FETCH_TIMEOUT, USER_AGENT } from './fetchHtml';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const isPng = buffer => buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE);

const isNearWhiteOrBlack = (r, g, b) => (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15);

// Averages pixel color, preferring non-transparent, non-background-looking pixels (most
// favicons are a small colored mark on a white/transparent/black field) — falling back to
// every opaque pixel if that leaves nothing (e.g. a genuinely monochrome icon).
const averageColorFromPng = buffer => {
	const { data, width, height } = PNG.sync.read(buffer);

	const opaqueSum = { r: 0, g: 0, b: 0, count: 0 };
	const vividSum = { r: 0, g: 0, b: 0, count: 0 };

	for (let i = 0; i < width * height; i++) {
		const offset = i * 4;
		const alpha = data[offset + 3];

		if (alpha < 16) continue;

		const r = data[offset];
		const g = data[offset + 1];
		const b = data[offset + 2];

		opaqueSum.r += r;
		opaqueSum.g += g;
		opaqueSum.b += b;
		opaqueSum.count++;

		if (!isNearWhiteOrBlack(r, g, b)) {
			vividSum.r += r;
			vividSum.g += g;
			vividSum.b += b;
			vividSum.count++;
		}
	}

	const sum = vividSum.count > 0 ? vividSum : opaqueSum;

	if (!sum.count) return null;

	return `rgb(${Math.round(sum.r / sum.count)}, ${Math.round(sum.g / sum.count)}, ${Math.round(sum.b / sum.count)})`;
};

// Extracts the largest embedded image from an .ico container. Only PNG-format entries are
// supported (most modern icons embed one); legacy BMP/DIB entries are skipped.
const extractIcoPng = buffer => {
	if (buffer.length < 6) return null;

	const count = buffer.readUInt16LE(4);
	let best = null;

	for (let i = 0; i < count; i++) {
		const entryOffset = 6 + i * 16;

		if (entryOffset + 16 > buffer.length) break;

		const width = buffer.readUInt8(entryOffset) || 256;
		const height = buffer.readUInt8(entryOffset + 1) || 256;
		const size = buffer.readUInt32LE(entryOffset + 8);
		const offset = buffer.readUInt32LE(entryOffset + 12);

		if (offset + size > buffer.length) continue;

		const area = width * height;

		if (!best || area > best.area) best = { area, offset, size };
	}

	if (!best) return null;

	const imageBuffer = buffer.subarray(best.offset, best.offset + best.size);

	return isPng(imageBuffer) ? imageBuffer : null;
};

const SVG_FILL_PATTERN = /fill\s*[:=]\s*["']?(#[0-9a-f]{3,8}|rgb\([^)]+\)|[a-z]+)["']?/i;

const colorFromSvg = text => {
	const color = text.match(SVG_FILL_PATTERN)?.[1];

	if (!color || /^(none|transparent|currentcolor|white|#fff|#ffffff)$/i.test(color)) return null;

	return color;
};

// Best-effort: PNG (standalone or embedded in a modern .ico) and a naive first-fill-color
// read for SVG. JPEG/GIF favicons and legacy BMP-in-ico icons aren't supported.
export const colorFromImage = (buffer, contentType) => {
	try {
		if (contentType?.includes('svg') || buffer.subarray(0, 5).toString('utf8').trim().startsWith('<')) {
			return colorFromSvg(buffer.toString('utf8'));
		}

		if (isPng(buffer)) return averageColorFromPng(buffer);

		if (buffer.length >= 4 && buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0) {
			const pngBuffer = extractIcoPng(buffer);

			return pngBuffer ? averageColorFromPng(pngBuffer) : null;
		}

		return null;
	} catch {
		return null;
	}
};

const ICON_LINK_PATTERN = /<link\s+[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi;
const HREF_PATTERN = /href=["']([^"']+)["']/i;
const REL_PATTERN = /rel=["']([^"']+)["']/i;
const SIZES_PATTERN = /sizes=["'](\d+)x(\d+)["']/i;

// Prefers the largest declared icon (apple-touch-icon defaults to a decent 180x180 when no
// explicit size is given) since more pixels make for a more representative average color.
const findFaviconHref = html => {
	const candidates = [...html.matchAll(ICON_LINK_PATTERN)]
		.map(([tag]) => {
			const href = tag.match(HREF_PATTERN)?.[1];
			const rel = tag.match(REL_PATTERN)?.[1]?.toLowerCase() || '';
			const [, w, h] = tag.match(SIZES_PATTERN) || [];

			const defaultArea = rel.includes('apple-touch-icon') ? 180 * 180 : 32 * 32;
			const area = w && h ? Number(w) * Number(h) : defaultArea;

			return href ? { href, area } : null;
		})
		.filter(Boolean);

	if (!candidates.length) return null;

	return candidates.sort((a, b) => b.area - a.area)[0].href;
};

const MAX_IMAGE_BYTES = 300_000;

// Finds the page's declared favicon (falling back to the conventional /favicon.ico) and fetches
// its raw bytes, bounded by size and time. Returns { buffer, contentType } or null.
export const fetchFaviconImage = async (html, baseUrl) => {
	let iconUrl;

	try {
		iconUrl = new URL(findFaviconHref(html) || '/favicon.ico', baseUrl);
	} catch {
		return null;
	}

	if (!ALLOWED_PROTOCOLS.includes(iconUrl.protocol)) return null;

	try {
		const response = await fetch(iconUrl, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT),
			headers: { 'User-Agent': USER_AGENT },
		});

		if (!response.ok || !response.body) return null;

		const reader = response.body.getReader();
		const chunks = [];
		let bytes = 0;

		while (bytes < MAX_IMAGE_BYTES) {
			const { done, value } = await reader.read();

			if (done) break;

			chunks.push(value);
			bytes += value.length;
		}

		reader.cancel().catch(() => {});

		return {
			buffer: Buffer.concat(chunks.map(chunk => Buffer.from(chunk))),
			contentType: response.headers.get('content-type'),
		};
	} catch {
		return null;
	}
};

// Decodes a representative color from the page's favicon.
export const detectFaviconColor = async (html, baseUrl) => {
	const image = await fetchFaviconImage(html, baseUrl);

	return image ? colorFromImage(image.buffer, image.contentType) : null;
};

// Fetches a page's favicon and encodes it as a data URI, for previewing before it's saved
// against a bookmark. Content-type falls back to a generic binary type if the server omits one.
export const fetchFaviconDataUri = async pageUrl => {
	const page = await fetchBoundedHtml(pageUrl);
	const image = page && (await fetchFaviconImage(page.html, page.baseUrl));

	if (!image) return null;

	const contentType = image.contentType || 'application/octet-stream';

	return `data:${contentType};base64,${image.buffer.toString('base64')}`;
};
