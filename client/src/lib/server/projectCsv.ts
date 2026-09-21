import type {
	DynamicFormSchema,
	FormValue,
	MultiselectField,
	NumericField,
	SchemaField,
	ToggleField
} from '$lib/components/dynamic-region-form/types';
import {
	coerceDefaults,
	forEachField,
	getFieldErrorMessage,
	hasInputValue,
	initializeFieldValues,
	isCustomCrossFieldRuleViolated,
	isDisabled,
	mapFieldsById
} from '$lib/components/dynamic-region-form/utils';
import { CsvError, detectCsvDelimiter, LINE_BREAKS, parseCsv } from '$lib/csv';
import { isUrlSafeName, URL_RESERVED_CHARACTERS_MESSAGE } from '$lib/string';
import type { Region } from '$lib/types/userState';

export const REGION_COLUMN_HEADER = 'Region';
const REGION_COLUMN_KEYS = ['region', 'region name', 'name'];
/**
 * Rows starting with this and a space are notes - such as the help row of the template - and are never read
 * as regions. The space keeps a region mistakenly named "#1" from being skipped without a word.
 */
const COMMENT_CELL = /^#(\s|$)/;
/** A comment as it appears in the raw file, where a spreadsheet may have wrapped the cell in quotes. */
const COMMENT_LINE = /^\s*"?#(\s|"|$)/;
/** Spreadsheets save xlsx and ods workbooks as zip archives, and old xls workbooks in this compound format. */
const WORKBOOK_SIGNATURES = ['PK' + String.fromCharCode(3, 4), String.fromCharCode(0xd0, 0xcf, 0x11, 0xe0)];
/** Written between the options of a multiselect cell, as no spreadsheet splits cells on it. */
export const MULTISELECT_SEPARATOR = '|';
/** Read between the options of a multiselect cell, as long as the cell reached us in one piece. */
const MULTISELECT_SEPARATORS = /[|;,]/;
/** Brackets and quotes around options written as a list, such as ["py_only", "py_pbo"]. */
const OPTION_WRAPPERS = /^[[\]"'\s]+|[[\]"'\s]+$/g;
/** Includes the words French, Portuguese and Spanish spreadsheets write booleans with, such as VRAI and FAUX. */
const TRUTHY_VALUES = ['true', 'yes', 'y', 'on', 'vrai', 'oui', 'verdadeiro', 'sim', 'verdadero', 'si'];
const FALSY_VALUES = ['false', 'no', 'n', 'off', 'faux', 'non', 'falso', 'nao', 'não'];
/**
 * Percent and dollar signs - which cells formatted as percentages or currency are saved with - and spacing,
 * including the spaces some locales group thousands with, are not part of a number.
 */
const NUMBER_NOISE = /[%$\s]/g;
const DECIMAL_NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
/** A whole number grouped into thousands, such as 20,000 or 20.000. */
const GROUPED_WHOLE_NUMBER = /^[+-]?\d{1,3}([.,])\d{3}(\1\d{3})*$/;
const MAX_REPORTED_ERRORS = 10;
const MAX_QUOTED_HEADER_LENGTH = 40;

export interface CsvField {
	field: SchemaField;
	isPreRun: boolean;
}

/** A column is either the region name or one of the form fields, or unused when its header is blank. */
type Column = { kind: 'region' } | { kind: 'field'; field: SchemaField } | null;

/** Files saved with semicolons come from locales that also write decimals with a comma, such as 1,85. */
type DecimalSeparator = '.' | ',';

interface ParseContext {
	columns: Column[];
	fields: CsvField[];
	fieldsById: Map<string, SchemaField>;
	decimalSeparator: DecimalSeparator;
	schema: DynamicFormSchema;
}

interface CellResult {
	value?: FormValue;
	error?: string;
}

export interface ParsedProjectCsv {
	regions: Region[];
	errors: string[];
}

/** Headers and options are matched ignoring case, spacing and punctuation, so "is_seasonal" matches "Is seasonal?". */
const normaliseKey = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

export const labelOf = (field: SchemaField): string => `"${field.label.trim()}"`;

/** Display fields are derived from other fields, so they are never read from or written to a CSV. */
export const getCsvFields = (schema: DynamicFormSchema): CsvField[] => {
	const fields: CsvField[] = [];
	forEachField(schema.groups, (field, group) => {
		if (field.type !== 'display' && !field.hidden) fields.push({ field, isPreRun: Boolean(group.preRun) });
	});
	return fields;
};

const buildColumnLookup = (fields: CsvField[]): Map<string, SchemaField> => {
	const lookup = new Map<string, SchemaField>();
	// ids go in first, so that a label can never take the place of another field's id
	const names = [
		...fields.map(({ field }) => [field.id, field] as const),
		...fields.map(({ field }) => [field.label, field] as const)
	];
	for (const [name, field] of names) {
		const key = normaliseKey(name);
		if (!lookup.has(key)) lookup.set(key, field);
	}
	return lookup;
};

const isSkippedRow = (row: string[]): boolean =>
	row.every((cell) => cell.trim() === '') || COMMENT_CELL.test(row[0].trim());

const quoteHeader = (header: string): string =>
	`"${header.length > MAX_QUOTED_HEADER_LENGTH ? `${header.slice(0, MAX_QUOTED_HEADER_LENGTH)}...` : header}"`;

/**
 * Mostly unrecognised headings mean the file was saved with the wrong separator or has lost its heading
 * row. Every other heading error is then a symptom of that, so one message explains the file better.
 */
const isMostlyUnrecognised = (unrecognised: string[], headerCount: number): boolean =>
	unrecognised.length * 2 > headerCount;

const describeUnrecognisedFile = (unrecognised: string[]): string =>
	`Most column headings were not recognised, such as ${unrecognised.slice(0, 3).map(quoteHeader).join(', ')}. The first row must hold the headings from the template, and the file must be saved as a CSV separated by commas or semicolons.`;

const mapHeaderRow = (headerRow: string[], lookup: Map<string, SchemaField>) => {
	const columns: Column[] = [];
	const duplicates: string[] = [];
	const unrecognised: string[] = [];
	const seen = new Set<string>();

	headerRow.forEach((cell) => {
		const header = cell.trim();
		const key = normaliseKey(header);
		if (!key) return columns.push(null);

		const isRegionColumn = REGION_COLUMN_KEYS.includes(key);
		const field = lookup.get(key);
		if (!isRegionColumn && !field) {
			unrecognised.push(header);
			return columns.push(null);
		}

		const id = isRegionColumn ? REGION_COLUMN_HEADER : field!.id;
		if (seen.has(id)) {
			duplicates.push(`Column ${quoteHeader(header)} appears more than once.`);
			return columns.push(null);
		}
		seen.add(id);

		columns.push(isRegionColumn ? { kind: 'region' } : { kind: 'field', field: field! });
	});

	const headerCount = headerRow.filter((cell) => normaliseKey(cell)).length;
	if (isMostlyUnrecognised(unrecognised, headerCount))
		return { columns, errors: [describeUnrecognisedFile(unrecognised)] };

	const errors = [...unrecognised.map((header) => `Column ${quoteHeader(header)} is not recognised.`), ...duplicates];
	if (!seen.has(REGION_COLUMN_HEADER)) {
		errors.push(`The first row must hold the column headings, including a "${REGION_COLUMN_HEADER}" column.`);
	}

	return { columns, errors };
};

const parseNumberCell = (field: NumericField, rawValue: string, decimalSeparator: DecimalSeparator): CellResult => {
	let value = rawValue.replace(NUMBER_NOISE, '');
	// whole numbers can only be grouped into thousands, whichever character a spreadsheet grouped them with
	if (field.integer && GROUPED_WHOLE_NUMBER.test(value)) value = value.replace(/[.,]/g, '');
	else if (decimalSeparator === ',') value = value.replace(',', '.');

	if (DECIMAL_NUMBER.test(value)) return { value: Number(value) };

	const hint = rawValue.includes(',') ? ' - write decimals with "." and leave out thousands separators' : '';
	return { error: `${labelOf(field)} must be a number, but is "${rawValue}"${hint}` };
};

const parseToggleCell = (field: ToggleField, rawValue: string): CellResult => {
	const value = rawValue.trim().toLowerCase();
	// spreadsheets sometimes save booleans as numbers, such as 1 or 0.0
	const number = DECIMAL_NUMBER.test(value) ? Number(value) : NaN;
	if (TRUTHY_VALUES.includes(value) || number === 1) return { value: true };
	if (FALSY_VALUES.includes(value) || number === 0) return { value: false };
	return { error: `${labelOf(field)} must be true or false, but is "${rawValue}"` };
};

const parseMultiselectCell = (field: MultiselectField, rawValue: string): CellResult => {
	const options = new Map(
		field.options.flatMap(({ label, value }) => [
			[normaliseKey(value), value],
			[normaliseKey(label), value]
		])
	);
	const selected: string[] = [];

	for (const part of rawValue.split(MULTISELECT_SEPARATORS)) {
		const name = part.replace(OPTION_WRAPPERS, '');
		if (!name) continue;

		const value = options.get(normaliseKey(name));
		if (!value) {
			const valid = field.options.map((option) => option.value).join(', ');
			return {
				error: `${labelOf(field)} has no option "${name}". Valid options are ${valid}, with several separated by "${MULTISELECT_SEPARATOR}"`
			};
		}
		if (!selected.includes(value)) selected.push(value);
	}

	return { value: selected };
};

const parseCell = (field: SchemaField, rawValue: string, decimalSeparator: DecimalSeparator): CellResult => {
	switch (field.type) {
		case 'number':
		case 'slider':
			return parseNumberCell(field, rawValue, decimalSeparator);
		case 'toggle':
			return parseToggleCell(field, rawValue);
		case 'multiselect':
			return parseMultiselectCell(field, rawValue);
		default:
			return { error: `${labelOf(field)} cannot be set from a CSV` };
	}
};

/** Whether a value could belong in the column it sits under, rather than having been pushed there. */
const fitsColumn = (column: Column, cell: string, decimalSeparator: DecimalSeparator): boolean =>
	column?.kind === 'field' && !parseCell(column.field, cell.trim(), decimalSeparator).error;

const isOptionList = (field: MultiselectField, cell: string): boolean => {
	const { value, error } = parseMultiselectCell(field, cell);
	return !error && hasInputValue(value!);
};

/**
 * Spreadsheets that split cells on semicolons or commas break an unquoted list such as py_only;py_pbo into a
 * cell per option, shifting every later value along - without always making the row any longer, as trailing
 * blanks are dropped to make room. Options look like no other value, so each piece after a list that is one
 * of its options, and could not belong in the column it landed in, is joined back on.
 */
const rejoinSplitLists = (row: string[], { columns, decimalSeparator }: ParseContext): string[] => {
	const cells = [...row];

	columns.forEach((column, index) => {
		if (column?.kind !== 'field' || column.field.type !== 'multiselect' || !cells[index]?.trim()) return;

		let end = index + 1;
		while (
			end < cells.length &&
			isOptionList(column.field, cells[end]) &&
			!fitsColumn(columns[end], cells[end], decimalSeparator)
		) {
			end++;
		}
		if (end > index + 1) cells.splice(index, end - index, cells.slice(index, end).join(MULTISELECT_SEPARATOR));
	});

	return cells;
};

/** A value past the last heading means a cell was split in two, which shifts every value after it. */
const isSplitRow = (row: string[], { columns }: ParseContext): boolean =>
	row.some((cell, index) => cell.trim() !== '' && !columns[index]);

const SPLIT_ROW_ERROR =
	'there are more values than column headings - wrap any value containing a comma or semicolon in quotes';

/** Read one CSV row into the values it supplies - anything left blank is filled in by the caller. */
const parseRow = (row: string[], context: ParseContext) => {
	const values: Record<string, FormValue> = {};
	const errors: string[] = [];
	let name = '';

	context.columns.forEach((column, index) => {
		const rawValue = (row[index] ?? '').trim();
		if (!column || !rawValue) return;

		if (column.kind === 'region') {
			name = rawValue;
			return;
		}

		const { value, error } = parseCell(column.field, rawValue, context.decimalSeparator);
		if (error) errors.push(error);
		else values[column.field.id] = value!;
	});

	return { name, values, errors };
};

const describeDependency = (id: string, isOn: boolean, fieldsById: Map<string, SchemaField>): string => {
	const dependency = fieldsById.get(id);
	const label = dependency ? labelOf(dependency) : `"${id}"`;
	switch (dependency?.type) {
		case 'toggle':
			return `${label} is ${isOn}`;
		case 'multiselect':
			return `${label} ${isOn ? 'has a value' : 'is blank'}`;
		default:
			return `${label} is ${isOn ? 'above 0' : '0'}`;
	}
};

/**
 * Describe when a disabled field applies, such as `when "Expected ITN population usage" is above 0`, or
 * null for a field that never does.
 */
const describeRequirement = (field: SchemaField, fieldsById: Map<string, SchemaField>): string | null => {
	if (typeof field.disabled !== 'object') return null;

	const { fields, operator } = field.disabled;
	// a field disabled while every dependency is off applies once any is on, and the reverse for "all" and "any"
	const describe = (isOn: boolean, joiner: string) =>
		`when ${fields.map((id) => describeDependency(id, isOn, fieldsById)).join(joiner)}`;
	switch (operator) {
		case 'falsy':
			return describe(true, ' or ');
		case 'all':
			return describe(false, ' or ');
		default:
			return describe(false, ' and ');
	}
};

const validateFormValues = (
	suppliedValues: Record<string, FormValue>,
	formValues: Record<string, FormValue>,
	{ fields, fieldsById, schema }: ParseContext
): string[] => {
	const errors = fields
		.map(({ field }) => getFieldErrorMessage(field, formValues[field.id]))
		.filter((message): message is string => message !== null);

	// the form will not let a disabled field be switched on, so a CSV must not either - ITN types with no
	// ITN usage, say, would be costed as if the nets were bought
	for (const { field } of fields) {
		const supplied = suppliedValues[field.id];
		if (supplied === undefined || !isDisabled(formValues, field) || !hasInputValue(supplied)) continue;
		if (JSON.stringify(supplied) === JSON.stringify(coerceDefaults(field))) continue;
		const requirement = describeRequirement(field, fieldsById);
		errors.push(requirement ? `${labelOf(field)} only applies ${requirement}` : `${labelOf(field)} cannot be set`);
	}

	for (const rule of Object.values(schema.customValidationRules ?? {})) {
		if (isCustomCrossFieldRuleViolated(formValues, rule)) errors.push(rule.message);
	}

	return errors;
};

/** Row errors come from several sources, so normalise the trailing punctuation as they are joined. */
const formatRowError = (rowNumber: number, error: string): string => `Row ${rowNumber}: ${error.replace(/\.$/, '')}.`;

const limitErrors = (errors: string[]): string[] =>
	errors.length <= MAX_REPORTED_ERRORS
		? errors
		: [...errors.slice(0, MAX_REPORTED_ERRORS), `...and ${errors.length - MAX_REPORTED_ERRORS} more problems.`];

const readRows = (text: string) => {
	// notes above the headings may hold any punctuation, so only the heading line decides the delimiter
	const headerLine = text.split(LINE_BREAKS).find((line) => line.trim() !== '' && !COMMENT_LINE.test(line)) ?? '';
	const delimiter = detectCsvDelimiter(headerLine);
	try {
		return { rows: parseCsv(text, delimiter), delimiter, error: null };
	} catch (e) {
		if (e instanceof CsvError) return { rows: [], delimiter, error: e.message };
		throw e;
	}
};

/**
 * Turn an uploaded CSV into the regions of a new project.
 *
 * Every recognised column is validated against the region form schema and any value left blank falls
 * back to that field's default, so a CSV filled in with baseline values only is just as valid as one
 * that sets every parameter. Comma, semicolon and tab separated files are all read. Regions are only
 * returned when the whole file is free of errors.
 */
export const parseProjectCsv = (text: string, schema: DynamicFormSchema): ParsedProjectCsv => {
	if (WORKBOOK_SIGNATURES.some((signature) => text.startsWith(signature))) {
		return {
			regions: [],
			errors: ['This is a spreadsheet workbook, not a CSV file. Save it as CSV and upload that file instead.']
		};
	}

	const { rows, delimiter, error } = readRows(text);
	if (error) return { regions: [], errors: [error] };

	const headerIndex = rows.findIndex((row) => !isSkippedRow(row));
	if (headerIndex === -1) return { regions: [], errors: ['The CSV file is empty.'] };

	const fields = getCsvFields(schema);
	const { columns, errors: headerErrors } = mapHeaderRow(rows[headerIndex], buildColumnLookup(fields));
	if (headerErrors.length) return { regions: [], errors: limitErrors(headerErrors) };

	const context: ParseContext = {
		columns,
		fields,
		fieldsById: mapFieldsById(fields),
		decimalSeparator: delimiter === ';' ? ',' : '.',
		schema
	};
	const regions: Region[] = [];
	const errors: string[] = [];

	rows.forEach((row, index) => {
		if (index <= headerIndex || isSkippedRow(row)) return;
		const rowNumber = index + 1; // numbered as a spreadsheet numbers them

		const cells = rejoinSplitLists(row, context);
		// the values of a split row sit under the wrong headings, so any other error would only mislead
		if (isSplitRow(cells, context)) {
			errors.push(formatRowError(rowNumber, SPLIT_ROW_ERROR));
			return;
		}

		const { name, values, errors: rowErrors } = parseRow(cells, context);

		const formValues = initializeFieldValues(values, fields);
		if (!name) rowErrors.push('a region name is required');
		else if (!isUrlSafeName(name)) rowErrors.push(`region names ${URL_RESERVED_CHARACTERS_MESSAGE}`);
		else if (regions.some((region) => region.name === name))
			rowErrors.push(`region "${name}" is listed more than once`);
		rowErrors.push(...validateFormValues(values, formValues, context));

		if (rowErrors.length) errors.push(...rowErrors.map((error) => formatRowError(rowNumber, error)));
		else regions.push({ name, formValues, hasRunBaseline: false });
	});

	if (!errors.length && !regions.length) errors.push('The CSV file does not list any regions.');

	return errors.length ? { regions: [], errors: limitErrors(errors) } : { regions, errors };
};
