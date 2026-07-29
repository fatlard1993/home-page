import { describe, test, expect } from 'bun:test';
import { sniffImageType } from './imageType.js';

const bytes = (...values) => Buffer.from(values);
const withTrailer = buffer => Buffer.concat([buffer, Buffer.alloc(32)]);

describe('sniffImageType', () => {
	test('detects PNG', () => {
		expect(sniffImageType(withTrailer(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)))).toBe('image/png');
	});

	test('detects JPEG', () => {
		expect(sniffImageType(withTrailer(bytes(0xff, 0xd8, 0xff, 0xe0)))).toBe('image/jpeg');
	});

	test('detects ICO', () => {
		expect(sniffImageType(withTrailer(bytes(0x00, 0x00, 0x01, 0x00, 0x01)))).toBe('image/x-icon');
	});

	test('detects GIF', () => {
		expect(sniffImageType(Buffer.from('GIF89a....', 'latin1'))).toBe('image/gif');
	});

	test('detects BMP', () => {
		expect(sniffImageType(Buffer.from('BM......', 'latin1'))).toBe('image/bmp');
	});

	test('detects WebP', () => {
		expect(sniffImageType(Buffer.from('RIFF****WEBPVP8 ', 'latin1'))).toBe('image/webp');
	});

	test('detects AVIF', () => {
		expect(sniffImageType(Buffer.from('....ftypavif....', 'latin1'))).toBe('image/avif');
	});

	test('detects HEIC', () => {
		expect(sniffImageType(Buffer.from('....ftypheic....', 'latin1'))).toBe('image/heic');
	});

	test('detects SVG', () => {
		expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('image/svg+xml');
	});

	test('detects SVG behind an XML declaration', () => {
		expect(sniffImageType(Buffer.from('<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"></svg>'))).toBe(
			'image/svg+xml',
		);
	});

	test('rejects an HTML page', () => {
		// The actual failure this guards: a site with no /favicon.ico answers 200
		// with an error page, which was then stored as the bookmark's favicon.
		expect(sniffImageType(Buffer.from('<!doctype html><html><head></head></html>'))).toBe(null);
	});

	test('rejects HTML with leading whitespace', () => {
		expect(sniffImageType(Buffer.from('\r\n  <!DOCTYPE HTML>\n<html lang="en">'))).toBe(null);
	});

	test('rejects HTML with no doctype', () => {
		expect(sniffImageType(Buffer.from('<html><body>Not found</body></html>'))).toBe(null);
	});

	test('rejects plain text', () => {
		expect(sniffImageType(Buffer.from('Not Found'))).toBe(null);
	});

	test('rejects JSON', () => {
		expect(sniffImageType(Buffer.from('{"error":"not found"}'))).toBe(null);
	});

	test('rejects a buffer too short to identify', () => {
		expect(sniffImageType(bytes(0x89, 0x50))).toBe(null);
	});

	test('rejects empty and missing input', () => {
		expect(sniffImageType(Buffer.alloc(0))).toBe(null);
		expect(sniffImageType(null)).toBe(null);
		expect(sniffImageType(undefined)).toBe(null);
	});
});
