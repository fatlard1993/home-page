// data:[<mediatype>][;<param>=<value>]...;base64,<data>
//
// Parameters arrive in shapes a single pattern struggles with - servers write
// "text/html; charset=utf-8" with a space after the semicolon, and there can be
// more than one parameter - so this splits on the separators instead of trying
// to spell every legal arrangement in one expression.

/**
 * Parses a base64 data URI.
 * @param {string} uri The data URI to parse.
 * @returns {{mediaType: string, data: string} | null} The declared media type
 *   (parameters dropped) and the still-encoded payload, or null if the input
 *   isn't a base64 data URI.
 */
export const parseBase64DataUri = uri => {
	if (typeof uri !== 'string') return null;

	const separator = uri.indexOf(',');

	if (separator === -1) return null;

	const header = uri.slice(0, separator);
	const data = uri.slice(separator + 1);

	if (!data || !header.toLowerCase().startsWith('data:')) return null;

	const segments = header
		.slice('data:'.length)
		.split(';')
		.map(segment => segment.trim().toLowerCase());

	// Percent-encoded data URIs would need different decoding, so they're not
	// treated as a near-miss to be salvaged.
	if (segments.pop() !== 'base64') return null;

	return { mediaType: segments.shift() || 'application/octet-stream', data };
};
