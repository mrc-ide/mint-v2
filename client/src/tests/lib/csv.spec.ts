import { BYTE_ORDER_MARK, CsvError, decodeCsvBytes, parseCsv } from '$lib/csv';

describe('parseCsv', () => {
	it('should parse a simple grid', () => {
		expect(parseCsv('region,population\nNorth,100\nSouth,200')).toEqual([
			['region', 'population'],
			['North', '100'],
			['South', '200']
		]);
	});

	it.each([
		[';', 'a;b\n1;2'],
		['\t', 'a\tb\n1\t2']
	])('should detect "%s" as the delimiter', (_delimiter, text) => {
		expect(parseCsv(text)).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('should detect the delimiter of a file whose cells hold the other ones', () => {
		expect(parseCsv('a;b\n"1,2";3\n')).toEqual([
			['a', 'b'],
			['1,2', '3']
		]);
	});

	it('should fall back to a comma for a single column', () => {
		expect(parseCsv('Region\nNorth')).toEqual([['Region'], ['North']]);
	});

	it('should handle CRLF line breaks and a trailing line break', () => {
		expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('should handle the lone CR line breaks of Macintosh CSV files', () => {
		expect(parseCsv('a,b\r1,2\r')).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('should strip a byte order mark', () => {
		expect(parseCsv(`${BYTE_ORDER_MARK}region\nNorth`)).toEqual([['region'], ['North']]);
	});

	it('should keep delimiters, line breaks and escaped quotes inside quoted cells', () => {
		expect(parseCsv('"a,b","line\nbreak","say ""hi"""')).toEqual([['a,b', 'line\nbreak', 'say "hi"']]);
	});

	// no spreadsheet writes a space before a quote, so this is reported as a split row rather than read
	it('should treat a quote after leading whitespace as a literal character', () => {
		expect(parseCsv('a, "b,c"')).toEqual([['a', ' "b', 'c"']]);
	});

	it('should keep a quote in the middle of a cell as a literal character', () => {
		expect(parseCsv('5" zone,a\nb,c')).toEqual([
			['5" zone', 'a'],
			['b', 'c']
		]);
	});

	it('should throw rather than swallow the rest of the file when a quote is never closed', () => {
		expect(() => parseCsv('a,b\n"c,d\ne,f')).toThrow(new CsvError('Row 2 has a quote (") that is never closed.', 2));
	});

	it('should leave out blank rows', () => {
		expect(parseCsv('a,b\n\n1,2')).toEqual([
			['a', 'b'],
			['1', '2']
		]);
	});

	it('should keep empty cells', () => {
		expect(parseCsv('a,,c')).toEqual([['a', '', 'c']]);
	});

	it('should return no rows for empty text', () => {
		expect(parseCsv('')).toEqual([]);
	});
});

describe('decodeCsvBytes', () => {
	const bytes = (...values: number[]) => Uint8Array.from(values).buffer;
	const e = 0xe9; // e acute in the Windows code page

	it('should decode UTF-8, dropping its byte order mark', () => {
		const encoded = new TextEncoder().encode(`${BYTE_ORDER_MARK}Région`);
		expect(decodeCsvBytes(encoded.buffer as ArrayBuffer)).toBe('Région');
	});

	it('should fall back to the Windows code page that Excel saves plain CSV files in', () => {
		expect(decodeCsvBytes(bytes(0x52, e, 0x67))).toBe('Rég');
	});

	it('should decode UTF-16 little endian files by their byte order mark', () => {
		expect(decodeCsvBytes(bytes(0xff, 0xfe, 0x52, 0, e, 0))).toBe('Ré');
	});

	it('should decode UTF-16 big endian files by their byte order mark', () => {
		expect(decodeCsvBytes(bytes(0xfe, 0xff, 0, 0x52, 0, e))).toBe('Ré');
	});
});
