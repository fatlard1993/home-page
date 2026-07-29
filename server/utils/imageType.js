// Identifies an image by its bytes rather than by what the server said it was.
// Neither direction of the declared Content-Type can be trusted: real .ico
// files are commonly served as application/octet-stream, and a site with no
// /favicon.ico usually answers with a 200 and an HTML error page rather than a
// 404. Only the bytes settle it.

const startsWith = (buffer, bytes) =>
	buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);

// latin1 so a byte never expands into a multi-byte character and shifts the
// offsets these container checks depend on.
const tag = (buffer, offset, length) => buffer.subarray(offset, offset + length).toString('latin1');

const HTML_PATTERN = /<!doctype\s+html|<html[\s>]/i;
const SVG_PATTERN = /<svg[\s>]/i;

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const ICO_MAGIC = [0x00, 0x00, 0x01, 0x00];

/**
 * Detects the media type of an image buffer.
 * @param {Buffer} buffer Bytes to inspect.
 * @returns {string | null} The detected media type, or null if it isn't an image.
 */
export const sniffImageType = buffer => {
	if (!buffer || buffer.length < 4) return null;

	if (startsWith(buffer, PNG_MAGIC)) return 'image/png';
	if (startsWith(buffer, JPEG_MAGIC)) return 'image/jpeg';
	if (startsWith(buffer, ICO_MAGIC)) return 'image/x-icon';

	const leading = tag(buffer, 0, 6);

	if (leading === 'GIF87a' || leading === 'GIF89a') return 'image/gif';
	if (leading.startsWith('BM')) return 'image/bmp';
	if (leading.startsWith('RIFF') && tag(buffer, 8, 4) === 'WEBP') return 'image/webp';

	// ISO base media containers put the brand right after the ftyp box header.
	if (tag(buffer, 4, 4) === 'ftyp') {
		const brand = tag(buffer, 8, 4);

		if (brand === 'avif' || brand === 'avis') return 'image/avif';
		if (brand.startsWith('hei') || brand.startsWith('mif')) return 'image/heic';
	}

	// SVG is the one text format worth accepting, which means telling it apart
	// from the HTML error pages that arrive in its place.
	const head = buffer.subarray(0, 1024).toString('utf8');

	if (HTML_PATTERN.test(head)) return null;
	if (SVG_PATTERN.test(head)) return 'image/svg+xml';

	return null;
};
