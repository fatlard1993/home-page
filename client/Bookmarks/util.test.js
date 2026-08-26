import { describe, test, expect, beforeEach } from 'bun:test';
import { isLink, fixLink, batchFieldsChanged, saveRecentColor, getRecentColors } from './util.js';

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
	test('preserves an http URL', () => {
		expect(fixLink('http://example.com')).toBe('http://example.com');
	});
	test('does not return a javascript: URL as a link', () => {
		// isLink's hostname form accepts javascript://…, which would run on click or once saved.
		const payload = 'javascript://%0aalert(document.cookie)';

		expect(fixLink(payload)).toBe(`http://google.com/search?q=${encodeURIComponent(payload)}`);
	});
	test('does not return a data: URL as a link', () => {
		const payload = 'data://text/html,<script>alert(1)</script>';

		expect(fixLink(payload)).toBe(`http://google.com/search?q=${encodeURIComponent(payload)}`);
	});
	test('does not return whitespace-obfuscated script URLs as links', () => {
		// The browser trims leading control chars and strips interior tabs/newlines before reading a
		// scheme, so each of these resolves to a live javascript:/vbscript:/data: URL at the href sink
		// unless it is parsed the same way and diverted.
		for (const payload of [
			' javascript://%0aalert(1)',
			'\tjavascript://%0aalert(1)',
			'java\tscript://%0aalert(1)',
			' vbscript://foo',
			' data://text/html,<script>1</script>',
		]) {
			expect(fixLink(payload)).toBe(`http://google.com/search?q=${encodeURIComponent(payload)}`);
		}
	});
	test('a host with a port is a link, not a scheme', () => {
		// The scheme test must not swallow host:port — the most common URL shape on a LAN home page.
		expect(fixLink('nas.lan:8123')).toBe('http://nas.lan:8123');
		expect(fixLink('example.com:8080/path')).toBe('http://example.com:8080/path');
	});
	test('localhost with a port is a link, not a scheme', () => {
		expect(fixLink('localhost:3000')).toBe('http://localhost:3000');
	});
});

describe('getRecentColors', () => {
	beforeEach(() => localStorage.clear());

	test('returns an empty list when nothing is stored', () => {
		expect(getRecentColors()).toEqual([]);
	});
	test('returns stored colors', () => {
		localStorage.setItem('recentColors', JSON.stringify(['#123456', '#654321']));
		expect(getRecentColors()).toEqual(['#123456', '#654321']);
	});
	test('returns an empty list for corrupt JSON', () => {
		localStorage.setItem('recentColors', '{not json');
		expect(getRecentColors()).toEqual([]);
	});
	test('returns an empty list for well-formed JSON that is not an array', () => {
		localStorage.setItem('recentColors', '"abc"');
		expect(getRecentColors()).toEqual([]);

		localStorage.setItem('recentColors', '5');
		expect(getRecentColors()).toEqual([]);
	});
	test('drops non-string and empty members', () => {
		localStorage.setItem('recentColors', JSON.stringify([null, 5, {}, '', '#fff']));
		expect(getRecentColors()).toEqual(['#fff']);
	});
});

describe('batchFieldsChanged', () => {
	test('unchanged bookmark counts as unchanged', () => {
		expect(batchFieldsChanged({ category: 'a', order: 2 }, { category: 'a', order: 2 })).toBe(false);
	});
	test('reordered bookmark counts as changed', () => {
		expect(batchFieldsChanged({ category: 'a', order: 3 }, { category: 'a', order: 2 })).toBe(true);
	});
	test('recategorized bookmark counts as changed', () => {
		expect(batchFieldsChanged({ category: 'b', order: 2 }, { category: 'a', order: 2 })).toBe(true);
	});
	test('treats missing and empty category as the same', () => {
		expect(batchFieldsChanged({ order: 0 }, { category: '', order: 0 })).toBe(false);
		expect(batchFieldsChanged({ category: '', order: 0 }, { order: 0 })).toBe(false);
	});
	test('counts a bookmark orphaned out of a deleted category as changed', () => {
		expect(batchFieldsChanged({ category: '', order: 0 }, { category: 'gone', order: 0 })).toBe(true);
	});
	test('categories compare on order and color alone', () => {
		expect(batchFieldsChanged({ order: 1 }, { order: 1 })).toBe(false);
		expect(batchFieldsChanged({ order: 1 }, { order: 4 })).toBe(true);
	});
	test('counts a record with no stored counterpart as changed', () => {
		expect(batchFieldsChanged({ order: 0 }, undefined)).toBe(true);
	});
	test('counts an unset stored order as changed', () => {
		expect(batchFieldsChanged({ order: 0 }, { order: '' })).toBe(true);
	});
	test('counts a repaint as changed', () => {
		expect(batchFieldsChanged({ order: 0, color: 'red' }, { order: 0, color: 'blue' })).toBe(true);
	});
	test('counts painting a previously colorless record as changed', () => {
		expect(batchFieldsChanged({ order: 0, color: 'red' }, { order: 0 })).toBe(true);
	});
	test('counts erasing a color as changed', () => {
		expect(batchFieldsChanged({ order: 0, color: '' }, { order: 0, color: 'red' })).toBe(true);
	});
	test('painting the color a record already had is not a change', () => {
		expect(batchFieldsChanged({ order: 0, color: 'red' }, { order: 0, color: 'red' })).toBe(false);
	});
	test('treats missing and empty color as the same', () => {
		expect(batchFieldsChanged({ order: 0 }, { order: 0, color: '' })).toBe(false);
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
	test('recovers from a corrupt store instead of throwing', () => {
		localStorage.setItem('recentColors', '{not json');
		saveRecentColor('#ff0000');
		expect(JSON.parse(localStorage.getItem('recentColors'))).toEqual(['#ff0000']);
	});
});
