export const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const QUOTE = '"';
const LINE_BREAK = '\r\n';
/** Spreadsheets save CSVs with commas, or with semicolons in locales that write decimals with a comma. */
const DELIMITERS = [',', ';', '\t'] as const;
export type CsvDelimiter = (typeof DELIMITERS)[number];

export class CsvError extends Error {
	row: number;

	constructor(message: string, row: number) {
		super(message);
		this.name = 'CsvError';
		this.row = row;
	}
}

/** Windows, Unix and classic Mac OS - which Excel for Mac still saves "Macintosh CSV" files with. */
export const LINE_BREAKS = /\r\n|\r|\n/;

const stripByteOrderMark = (text: string): string => (text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);

/**
 * Decode an uploaded file. Excel saves "CSV UTF-8" as UTF-8 but plain "CSV" in the Windows code page, and
 * "Unicode Text" as UTF-16, so the bytes decide - otherwise accented names would be garbled.
 */
export const decodeCsvBytes = (bytes: ArrayBuffer): string => {
	const [first, second] = new Uint8Array(bytes);
	if (first === 0xff && second === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
	if (first === 0xfe && second === 0xff) return new TextDecoder('utf-16be').decode(bytes);
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch (_e) {
		return new TextDecoder('windows-1252').decode(bytes);
	}
};

/** Guess the delimiter from a line of column headings, which - unlike data - never holds a separator. */
export const detectCsvDelimiter = (headerLine: string): CsvDelimiter => {
	const unquoted = stripByteOrderMark(headerLine).replace(/"[^"]*"/g, '');
	const count = (delimiter: string) => unquoted.split(delimiter).length - 1;

	return DELIMITERS.reduce((best, delimiter) => (count(delimiter) > count(best) ? delimiter : best));
};

/**
 * Parse RFC 4180 style CSV text into a grid of raw cell values.
 *
 * Quoted cells may contain delimiters, line breaks and escaped (doubled) quotes. A quote anywhere other
 * than the start of a cell is kept as a literal character, as spreadsheets do. Rows are returned as they
 * appear in the file, including blank ones, so that callers can report errors by row number.
 *
 * @throws {CsvError} When a quoted cell is never closed, which would otherwise swallow the rest of the file.
 */
export const parseCsv = (text: string, delimiter: CsvDelimiter = ','): string[][] => {
	const input = stripByteOrderMark(text);
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let isQuoted = false;
	let quotedCellRow = 0;

	const endRow = () => {
		row.push(cell);
		rows.push(row);
		cell = '';
		row = [];
	};

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (isQuoted) {
			const isEscapedQuote = char === QUOTE && input[i + 1] === QUOTE;
			if (isEscapedQuote) i++;
			if (char === QUOTE && !isEscapedQuote) isQuoted = false;
			else cell += char;
			continue;
		}

		switch (char) {
			case delimiter:
				row.push(cell);
				cell = '';
				break;
			case '\r':
				if (input[i + 1] !== '\n') endRow(); // a lone \r ends the row, otherwise the \n that follows does
				break;
			case '\n':
				endRow();
				break;
			case QUOTE:
				// only a quote that opens a cell starts a quoted value - the whitespace before it is dropped
				if (cell.trim() === '') {
					isQuoted = true;
					quotedCellRow = rows.length + 1;
					cell = '';
					break;
				}
				cell += char;
				break;
			default:
				cell += char;
		}
	}

	if (isQuoted) {
		throw new CsvError(`Row ${quotedCellRow} has a quote (") that is never closed.`, quotedCellRow);
	}
	endRow();

	// a trailing line break yields a final row holding a single empty cell - drop it
	const lastRow = rows[rows.length - 1];
	if (lastRow.length === 1 && lastRow[0] === '') rows.pop();

	return rows;
};

/** Quote any cell that a spreadsheet could split or trim, including on semicolons and tabs. */
const escapeCell = (value: string): string =>
	/[",;\t\r\n]|^\s|\s$/.test(value) ? `${QUOTE}${value.replaceAll(QUOTE, QUOTE + QUOTE)}${QUOTE}` : value;

/** Serialise a grid of cell values to comma separated CSV text. */
export const serialiseCsv = (rows: string[][]): string =>
	rows.map((row) => row.map(escapeCell).join(',')).join(LINE_BREAK) + LINE_BREAK;
