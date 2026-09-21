import type {
	DynamicFormSchema,
	FormValue,
	MultiselectField,
	SchemaField
} from '$lib/components/dynamic-region-form/types';
import {
	coerceDefaults,
	hasInputValue,
	initializeFieldValues,
	isDisabled,
	mapFieldsById
} from '$lib/components/dynamic-region-form/utils';
import { serialiseCsv } from '$lib/csv';
import { URL_RESERVED_CHARACTERS_MESSAGE } from '$lib/string';
import { getCsvFields, labelOf, MULTISELECT_SEPARATOR, REGION_COLUMN_HEADER, type CsvField } from './projectCsv';

export const PROJECT_CSV_TEMPLATE_FILENAME = 'mint-project-template.csv';

const exampleOptions = (field: MultiselectField): string[] => field.options.slice(0, 2).map((option) => option.value);

const getExampleValues = (fields: CsvField[], fieldsById: Map<string, SchemaField>): Record<string, FormValue> => {
	const values = initializeFieldValues({}, fields);

	for (const { field } of fields) {
		if (field.type === 'multiselect' && !hasInputValue(values[field.id])) values[field.id] = exampleOptions(field);
		if (typeof field.disabled !== 'object' || field.disabled.operator !== 'falsy') continue;
		for (const id of field.disabled.fields) {
			const dependency = fieldsById.get(id);
			if (dependency && !hasInputValue(values[id])) values[id] = exampleSwitchedOnValue(dependency);
		}
	}

	return values;
};

const exampleSwitchedOnValue = (field: SchemaField): FormValue => {
	switch (field.type) {
		case 'number':
		case 'slider': {
			const min = field.min ?? 0;
			const midpoint = (min + (field.max ?? min + 100)) / 2;
			return field.integer ? Math.round(midpoint) : midpoint;
		}
		case 'multiselect':
			return exampleOptions(field);
		default:
			return true;
	}
};

const describeDefault = (field: SchemaField): string => {
	const value = coerceDefaults(field) as FormValue;
	return Array.isArray(value) ? value.join(MULTISELECT_SEPARATOR) || 'none' : String(value);
};

const describeAcceptedValues = (field: SchemaField): string => {
	switch (field.type) {
		case 'number':
		case 'slider': {
			const kind = field.integer ? 'Whole number' : 'Number';
			const unit = field.unit === '%' ? ' (%)' : '';
			if (field.min !== undefined && field.max !== undefined) return `${kind} from ${field.min} to ${field.max}${unit}`;
			if (field.min !== undefined) return `${kind} of ${field.min} or more${unit}`;
			if (field.max !== undefined) return `${kind} of ${field.max} or less${unit}`;
			return `${kind}${unit}`;
		}
		case 'toggle':
			return 'true or false';
		case 'multiselect':
			return `One or more of ${field.options.map((option) => option.value).join(', ')} - separate several with "${MULTISELECT_SEPARATOR}"`;
		default:
			return '';
	}
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

const formatCell = (field: SchemaField, values: Record<string, FormValue>): string => {
	if (isDisabled(values, field)) return '';
	const value = values[field.id];
	return Array.isArray(value) ? value.join(MULTISELECT_SEPARATOR) : String(value);
};

/** The help row tells users what each column accepts, so they need not guess from the examples. */
const describeField = (field: SchemaField, fieldsById: Map<string, SchemaField>): string => {
	const parts = [describeAcceptedValues(field), `Blank = ${describeDefault(field)}`];
	const requirement = describeRequirement(field, fieldsById);
	if (requirement) parts.push(`Only applies ${requirement}`);
	return parts.join('. ');
};

const COMMENT_PREFIX = '# ';
export const buildProjectCsvTemplate = (schema: DynamicFormSchema): string => {
	const fields = getCsvFields(schema);
	const fieldsById = mapFieldsById(fields);
	const exampleValues = getExampleValues(fields, fieldsById);

	const header = [REGION_COLUMN_HEADER, ...fields.map(({ field }) => field.label.trim())];
	const help = [
		`${COMMENT_PREFIX}Help - this row is ignored. A unique region name, which ${URL_RESERVED_CHARACTERS_MESSAGE}`,
		...fields.map(({ field }) => describeField(field, fieldsById))
	];
	const allParameters = [
		'Example region - all parameters',
		...fields.map(({ field }) => formatCell(field, exampleValues))
	];
	const baselineOnly = [
		'Example region - baseline only',
		...fields.map(({ field, isPreRun }) => (isPreRun ? formatCell(field, exampleValues) : ''))
	];

	return serialiseCsv([header, help, allParameters, baselineOnly]);
};
