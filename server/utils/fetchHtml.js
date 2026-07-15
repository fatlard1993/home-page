export const ALLOWED_PROTOCOLS = ['http:', 'https:'];
export const FETCH_TIMEOUT = 5000;
export const USER_AGENT = 'Mozilla/5.0 (compatible; home-page-bot)';

const MAX_BYTES = 100_000;

// Fetches only enough of a page to read its <head>, bounded by size and time so a slow or
// huge page can't hang a lookup. Shared by brand-color and favicon detection, which both
// only need tags/links that live in the head.
export const fetchBoundedHtml = async url => {
	let parsed;

	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return null;

	try {
		const response = await fetch(parsed, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT),
			headers: { 'User-Agent': USER_AGENT },
		});

		if (!response.ok || !response.body) return null;

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		let html = '';
		let bytes = 0;

		while (bytes < MAX_BYTES) {
			const { done, value } = await reader.read();

			if (done) break;

			bytes += value.length;
			html += decoder.decode(value, { stream: true });

			if (/<\/head>/i.test(html)) break;
		}

		reader.cancel().catch(() => {});

		return { html, baseUrl: parsed };
	} catch {
		return null;
	}
};
