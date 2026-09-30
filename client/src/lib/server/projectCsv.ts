import type {
	CustomValidationRule,
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
	initializeFieldValues,
	isCustomCrossFieldRuleViolated,
	isDisabled,
	mapFieldsById
} from '$lib/components/dynamic-region-form/utils';
import { CsvError, parseCsv } from '$lib/csv';
import { isUrlSafeName, URL_RESERVED_CHARACTERS_MESSAGE } from '$lib/string';
import type { Region } from '$lib/types/userState';

export const REGION_COLUMN_HEADER = 'Region';
export const MULTISELECT_SEPARATOR = '|';
const COMMENT_CELL = /^#/;
const DECIMAL_NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
const MAX_REPORTED_ERRORS = 10;
const MAX_QUOTED_HEADER_LENGTH = 40;
const SPLIT_ROW_ERROR =
	'there are more values than column headings - wrap any value containing a comma or semicolon in quotes';

export interface CsvField {
	field: SchemaField;
	isPreRun: boolean;
	/** The group and sub group headings the field sits under in the form, such as `Baseline Options: Site Inputs`. */
	section: string;
}

/** A column is either the region name or one of the form fields, or unused when its header is blank. */
export type Column = { kind: 'region' } | { kind: 'field'; field: SchemaField } | null;

export interface ParseContext {
	columns: Column[];
	fields: CsvField[];
	fieldsById: Map<string, SchemaField>;
	schema: DynamicFormSchema;
}

export type CellResult = { value: FormValue } | { error: string };

export interface ParsedProjectCsv {
	regions: Region[];
	errors: string[];
}

export const labelOf = (field: SchemaField): string => `"${field.label.trim()}"`;

/** Display fields are derived from other fields, so they are never read from or written to a CSV. */
export const getCsvFields = (schema: DynamicFormSchema): CsvField[] => {
	const fields: CsvField[] = [];
	forEachField(schema.groups, (field, group, subGroup) => {
		if (field.type === 'display' || field.hidden) return;
		const section = group.title === subGroup.title ? group.title : `${group.title}: ${subGroup.title}`;
		fields.push({ field, isPreRun: Boolean(group.preRun), section });
	});
	return fields;
};

export const isSkippedRow = (row: string[]): boolean =>
	row.every((cell) => cell.trim() === '') || COMMENT_CELL.test(row[0].trim());

export const quoteHeader = (header: string): string =>
	`"${header.length > MAX_QUOTED_HEADER_LENGTH ? `${header.slice(0, MAX_QUOTED_HEADER_LENGTH)}...` : header}"`;

/** The template writes a column per field headed by its label, which is how a column is recognised. */
export const mapHeaderRow = (headerRow: string[], fields: CsvField[]): { columns: Column[]; errors: string[] } => {
	const lookup = new Map(fields.map(({ field }) => [field.label.trim(), field]));
	const seen = new Set<string>();
	const unrecognised: string[] = [];
	const duplicates: string[] = [];

	const columns = headerRow.map((cell): Column => {
		const header = cell.trim();
		if (!header) return null;

		const field = lookup.get(header);
		if (header !== REGION_COLUMN_HEADER && !field) {
			unrecognised.push(header);
			return null;
		}
		if (seen.has(header)) {
			duplicates.push(header);
			return null;
		}
		seen.add(header);

		return field ? { kind: 'field', field } : { kind: 'region' };
	});

	const errors = [
		...unrecognised.map((header) => `Column ${quoteHeader(header)} is not recognised.`),
		...duplicates.map((header) => `Column ${quoteHeader(header)} appears more than once.`)
	];

	return { columns, errors };
};

export const invalidValue = (field: SchemaField, expected: string, rawValue: string): CellResult => ({
	error: `${labelOf(field)} must be ${expected}, but is "${rawValue}"`
});

export const parseNumberCell = (field: NumericField, rawValue: string): CellResult =>
	DECIMAL_NUMBER.test(rawValue) ? { value: Number(rawValue) } : invalidValue(field, 'a number', rawValue);

export const parseToggleCell = (field: ToggleField, rawValue: string): CellResult => {
	const value = rawValue.toLowerCase();
	if (value === 'true' || value === 'false') return { value: value === 'true' };
	return invalidValue(field, 'true or false', rawValue);
};

export const parseMultiselectCell = (field: MultiselectField, rawValue: string): CellResult => {
	const valid = field.options.map((option) => option.value);
	const selected = rawValue
		.split(MULTISELECT_SEPARATOR)
		.map((part) => part.trim())
		.filter(Boolean);

	const invalid = selected.find((value) => !valid.includes(value));
	if (invalid !== undefined) {
		return {
			error: `${labelOf(field)} has no option "${invalid}". Valid options are ${valid.join(', ')}, with several separated by "${MULTISELECT_SEPARATOR}"`
		};
	}

	return { value: [...new Set(selected)] };
};

export const parseCell = (field: SchemaField, rawValue: string): CellResult => {
	switch (field.type) {
		case 'number':
		case 'slider':
			return parseNumberCell(field, rawValue);
		case 'toggle':
			return parseToggleCell(field, rawValue);
		case 'multiselect':
			return parseMultiselectCell(field, rawValue);
		default:
			return { error: `${labelOf(field)} cannot be set from a CSV` };
	}
};

/** A value past the last heading means a cell was split in two, which shifts every value after it. */
export const isSplitRow = (row: string[], columns: Column[]): boolean =>
	row.some((cell, index) => cell.trim() !== '' && !columns[index]);

/** Read one CSV row into the values it supplies - anything left blank is filled in by the caller. */
export const parseRow = (row: string[], columns: Column[]) => {
	const values: Record<string, FormValue> = {};
	const errors: string[] = [];
	let name = '';

	columns.forEach((column, index) => {
		const rawValue = row[index]?.trim();
		if (!column || !rawValue) return;

		if (column.kind === 'region') {
			name = rawValue;
			return;
		}

		const result = parseCell(column.field, rawValue);
		if ('error' in result) errors.push(result.error);
		else values[column.field.id] = result.value;
	});

	return { name, values, errors };
};

export const describeDependency = (id: string, isOn: boolean, fieldsById: Map<string, SchemaField>): string => {
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
export const describeRequirement = (field: SchemaField, fieldsById: Map<string, SchemaField>): string | null => {
	if (typeof field.disabled !== 'object') return null;

	const { fields, operator } = field.disabled;
	const isOn = operator === 'falsy';
	const joiner = operator === 'any' ? ' and ' : ' or ';
	return `when ${fields.map((id) => describeDependency(id, isOn, fieldsById)).join(joiner)}`;
};

/**
 * A field is set while disabled if it has a value that would be valid if the field were not disabled.
 */
export const isSetWhileDisabled = (
	field: SchemaField,
	supplied: FormValue | undefined,
	formValues: Record<string, FormValue>
): boolean =>
	supplied !== undefined &&
	isDisabled(formValues, field) &&
	JSON.stringify(supplied) !== JSON.stringify(coerceDefaults(field));

/** Add the fields a custom rule sums, with their values, to its message - such as `... 100% (from "A": 60, "B": 50)`. */
export const describeRuleViolation = (
	rule: CustomValidationRule,
	formValues: Record<string, FormValue>,
	fieldsById: Map<string, SchemaField>
): string => {
	const involved = rule.fields.map((id) => {
		const field = fieldsById.get(id);
		return `${field ? labelOf(field) : `"${id}"`}: ${formValues[id]}`;
	});
	return `${rule.message.replace(/\.$/, '')} (from ${involved.join(', ')})`;
};

export const validateFormValues = (
	suppliedValues: Record<string, FormValue>,
	formValues: Record<string, FormValue>,
	{ fields, fieldsById, schema }: ParseContext
): string[] => {
	const fieldErrors = fields
		.map(({ field }) => getFieldErrorMessage(field, formValues[field.id]))
		.filter((message): message is string => message !== null);

	const disabledErrors = fields
		.filter(({ field }) => isSetWhileDisabled(field, suppliedValues[field.id], formValues))
		.map(({ field }) => {
			const requirement = describeRequirement(field, fieldsById);
			return requirement ? `${labelOf(field)} only applies ${requirement}` : `${labelOf(field)} cannot be set`;
		});

	const ruleErrors = Object.values(schema.customValidationRules ?? {})
		.filter((rule) => isCustomCrossFieldRuleViolated(formValues, rule))
		.map((rule) => describeRuleViolation(rule, formValues, fieldsById));

	return [...fieldErrors, ...disabledErrors, ...ruleErrors];
};

export const validateRegionName = (name: string, regions: Region[]): string | null => {
	if (!name) return 'a region name is required';
	if (!isUrlSafeName(name)) return `region names ${URL_RESERVED_CHARACTERS_MESSAGE}`;
	if (regions.some((region) => region.name === name)) return `region "${name}" is listed more than once`;
	return null;
};

export const parseRegion = (
	row: string[],
	context: ParseContext,
	regions: Region[]
): { region: Region } | { errors: string[] } => {
	// the values of a split row sit under the wrong headings, so any other error would only mislead
	if (isSplitRow(row, context.columns)) return { errors: [SPLIT_ROW_ERROR] };

	const { name, values, errors } = parseRow(row, context.columns);
	const formValues = initializeFieldValues(values, context.fields);

	const nameError = validateRegionName(name, regions);
	if (nameError) errors.push(nameError);
	errors.push(...validateFormValues(values, formValues, context));

	return errors.length ? { errors } : { region: { name, formValues, hasRunBaseline: false } };
};

/** Row errors come from several sources, so normalise the trailing punctuation as they are joined. */
export const formatRowError = (rowNumber: number, error: string): string =>
	`Row ${rowNumber}: ${error.replace(/\.$/, '')}.`;

export const failure = (errors: string[]): ParsedProjectCsv => ({
	regions: [],
	errors:
		errors.length <= MAX_REPORTED_ERRORS
			? errors
			: [...errors.slice(0, MAX_REPORTED_ERRORS), `...and ${errors.length - MAX_REPORTED_ERRORS} more problems.`]
});

export const parseProjectCsv = (text: string, schema: DynamicFormSchema): ParsedProjectCsv => {
	let rows: string[][];
	try {
		rows = parseCsv(text);
	} catch (e) {
		if (e instanceof CsvError) return failure([e.message]);
		throw e;
	}

	const headerIndex = rows.findIndex((row) => !isSkippedRow(row));
	if (headerIndex === -1) return failure(['The CSV file is empty.']);

	const fields = getCsvFields(schema);
	const { columns, errors: headerErrors } = mapHeaderRow(rows[headerIndex], fields);
	if (headerErrors.length) return failure(headerErrors);

	const context: ParseContext = { columns, fields, fieldsById: mapFieldsById(fields), schema };
	const regions: Region[] = [];
	const errors: string[] = [];

	rows.forEach((row, index) => {
		if (index <= headerIndex || isSkippedRow(row)) return;

		const result = parseRegion(row, context, regions);
		if ('errors' in result) errors.push(...result.errors.map((error) => formatRowError(index + 1, error)));
		else regions.push(result.region);
	});

	if (errors.length) return failure(errors);
	if (!regions.length) return failure(['The CSV file does not list any regions.']);
	return { regions, errors };
};
