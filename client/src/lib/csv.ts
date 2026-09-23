import Papa from 'papaparse';

export const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export class CsvError extends Error {
	row: number;

	constructor(message: string, row: number) {
		super(message);
		this.name = 'CsvError';
		this.row = row;
	}
}

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

/**
 * Parse CSV text into a grid of raw cell values, guessing the delimiter and line break from the file.
 *
 * A file with a single column has no delimiter to guess, which is not a problem worth reporting.
 *
 * @throws {CsvError} When a quoted cell is never closed, which would otherwise swallow the rest of the file.
 */
export const parseCsv = (text: string): string[][] => {
	const { data, errors } = Papa.parse<string[]>(text, {
		delimitersToGuess: [',', ';', '\t'],
		skipEmptyLines: true
	});

	const unterminated = errors.find(({ code }) => code === 'MissingQuotes');
	if (unterminated) {
		const row = (unterminated.row ?? 0) + 1;
		throw new CsvError(`Row ${row} has a quote (") that is never closed.`, row);
	}

	return data;
};
