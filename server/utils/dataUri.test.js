import { describe, test, expect } from 'bun:test';
import { parseBase64DataUri } from './dataUri.js';

describe('parseBase64DataUri', () => {
	test('parses a plain media type', () => {
		expect(parseBase64DataUri('data:image/png;base64,AAAA')).toEqual({ mediaType: 'image/png', data: 'AAAA' });
	});

	test('accepts a parameter written with a space after the semicolon', () => {
		// What servers actually send, and what the previous pattern rejected.
		expect(parseBase64DataUri('data:text/html; charset=utf-8;base64,AAAA')).toEqual({
			mediaType: 'text/html',
			data: 'AAAA',
		});
	});

	test('accepts a parameter written without a space', () => {
		expect(parseBase64DataUri('data:image/svg+xml;charset=utf-8;base64,AAAA')).toEqual({
			mediaType: 'image/svg+xml',
			data: 'AAAA',
		});
	});

	test('accepts more than one parameter', () => {
		expect(parseBase64DataUri('data:image/png; charset=utf-8; foo=bar;base64,AAAA')).toEqual({
			mediaType: 'image/png',
			data: 'AAAA',
		});
	});

	test('defaults the media type when none is declared', () => {
		expect(parseBase64DataUri('data:;base64,AAAA')).toEqual({
			mediaType: 'application/octet-stream',
			data: 'AAAA',
		});
	});

	test('lower-cases the media type', () => {
		expect(parseBase64DataUri('data:IMAGE/PNG;BASE64,AAAA')?.mediaType).toBe('image/png');
	});

	test('keeps the payload verbatim', () => {
		expect(parseBase64DataUri('data:image/png;base64,aGVsbG8=')?.data).toBe('aGVsbG8=');
	});

	test('rejects a percent-encoded data URI', () => {
		expect(parseBase64DataUri('data:image/svg+xml,%3Csvg%3E')).toBe(null);
	});

	test('rejects a URI with no comma', () => {
		expect(parseBase64DataUri('data:image/png;base64')).toBe(null);
	});

	test('rejects an empty payload', () => {
		expect(parseBase64DataUri('data:image/png;base64,')).toBe(null);
	});

	test('rejects a non-data URI', () => {
		expect(parseBase64DataUri('https://example.com/icon.png')).toBe(null);
	});

	test('rejects non-string input', () => {
		expect(parseBase64DataUri(undefined)).toBe(null);
		expect(parseBase64DataUri(null)).toBe(null);
		expect(parseBase64DataUri(42)).toBe(null);
	});
});
