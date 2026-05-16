import { describe, test, expect, beforeEach } from 'bun:test';
import { isLink, fixLink, saveRecentColor } from './util.js';

describe('isLink', () => {
	test('recognizes https URLs', () => expect(isLink('https://example.com')).toBe(true));
	test('recognizes URLs without protocol', () => expect(isLink('example.com')).toBe(true));
	test('recognizes IPv4 addresses', () => expect(isLink('192.168.1.1')).toBe(true));
	test('recognizes localhost', () => expect(isLink('localhost')).toBe(true));
	test('recognizes localhost with port', () => expect(isLink('localhost:3000')).toBe(true));
	test('returns false for plain search terms', () => expect(isLink('hello world')).toBe(false));
	test('returns false for bare words', () => expect(isLink('justasearch')).toBe(false));
});

describe('fixLink', () => {
	test('preserves existing protocol', () => {
		expect(fixLink('https://example.com')).toBe('https://example.com');
	});
	test('prepends http:// to bare domain', () => {
		expect(fixLink('example.com')).toBe('http://example.com');
	});
	test('converts non-links to Google search', () => {
		expect(fixLink('hello world')).toBe('http://google.com/search?q=hello%20world');
	});
	test('encodes special chars in search query', () => {
		expect(fixLink('a & b')).toBe('http://google.com/search?q=a%20%26%20b');
	});
});

describe('saveRecentColor', () => {
	beforeEach(() => localStorage.clear());

	test('saves a color to localStorage', () => {
		saveRecentColor('#ff0000');
		expect(JSON.parse(localStorage.getItem('recentColors'))).toContain('#ff0000');
	});
	test('does nothing for falsy color', () => {
		saveRecentColor('');
		expect(localStorage.getItem('recentColors')).toBeNull();
	});
	test('does nothing for "random"', () => {
		saveRecentColor('random');
		expect(localStorage.getItem('recentColors')).toBeNull();
	});
	test('caps at 10 colors', () => {
		for (let i = 0; i < 15; i++) saveRecentColor(`#${String(i).padStart(6, '0')}`);
		expect(JSON.parse(localStorage.getItem('recentColors'))).toHaveLength(10);
	});
	test('deduplicates and promotes most-recent to front', () => {
		saveRecentColor('#ff0000');
		saveRecentColor('#00ff00');
		saveRecentColor('#ff0000');
		const colors = JSON.parse(localStorage.getItem('recentColors'));
		expect(colors[0]).toBe('#ff0000');
		expect(colors.filter(c => c === '#ff0000')).toHaveLength(1);
	});
});
