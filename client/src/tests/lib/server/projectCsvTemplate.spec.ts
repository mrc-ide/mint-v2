import type { MultiselectField, SchemaField } from '$lib/components/dynamic-region-form/types';
import { mapFieldsById } from '$lib/components/dynamic-region-form/utils';
import {
	describeAcceptedValues,
	describeDefault,
	describeField,
	exampleOptions,
	exampleSwitchedOnValue,
	formatCell,
	getExampleValues
} from '$lib/server/projectCsvTemplate';

const asField = (field: object) => field as unknown as SchemaField;
const OPTIONS = [
	{ label: 'A', value: 'a' },
	{ label: 'B', value: 'b' },
	{ label: 'C', value: 'c' }
];
const falsy = (...fields: string[]) => ({ type: 'cross_field', fields, operator: 'falsy' });

const kinds = asField({ id: 'kinds', label: 'Kinds', type: 'multiselect', options: OPTIONS });
const enabled = asField({ id: 'enabled', label: 'Enabled', type: 'toggle', default: false });
const usage = asField({ id: 'usage', label: 'Usage', type: 'number', min: 0, max: 100, integer: true, default: 0 });
const byUsage = asField({ id: 'by_usage', label: 'By usage', type: 'number', default: 0, disabled: falsy('usage') });

describe('projectCsvTemplate helpers', () => {
	it('exampleOptions should pick the first two options', () => {
		expect(exampleOptions(kinds as MultiselectField)).toEqual(['a', 'b']);
	});

	it.each([
		[{ type: 'number', min: 0, max: 10 }, 5],
		[{ type: 'slider', min: 0, max: 5, integer: true }, 3],
		[{ type: 'number', min: 1, max: 2 }, 1.5],
		[{ type: 'number' }, 50],
		[{ type: 'number', min: 10 }, 60],
		[{ type: 'toggle' }, true]
	])('exampleSwitchedOnValue(%j) should be %s', (field, expected) => {
		expect(exampleSwitchedOnValue(asField({ id: 'f', label: 'F', ...field }))).toBe(expected);
	});

	it('exampleSwitchedOnValue should pick example options for a multiselect', () => {
		expect(exampleSwitchedOnValue(kinds)).toEqual(['a', 'b']);
	});

	it('describeDefault should describe the default, or none for an empty list', () => {
		expect(describeDefault(usage)).toBe('0');
		expect(describeDefault(enabled)).toBe('false');
		expect(describeDefault(kinds)).toBe('none');
		expect(describeDefault(asField({ ...kinds, default: ['a', 'c'] }))).toBe('a|c');
	});

	it.each([
		[{ type: 'number', min: 0, max: 100, integer: true, unit: '%' }, 'Whole number from 0 to 100 (%)'],
		[{ type: 'slider', min: 1 }, 'Number of 1 or more'],
		[{ type: 'number', max: 9 }, 'Number of 9 or less'],
		[{ type: 'number' }, 'Number'],
		[{ type: 'toggle' }, 'true or false'],
		[{ type: 'display' }, '']
	])('describeAcceptedValues(%j) should be "%s"', (field, expected) => {
		expect(describeAcceptedValues(asField({ id: 'f', label: 'F', ...field }))).toBe(expected);
	});

	it('describeAcceptedValues should list the options of a multiselect', () => {
		expect(describeAcceptedValues(kinds)).toBe('One or more of a, b, c - separate several with "|"');
	});

	it('formatCell should write values, join lists and leave disabled fields blank', () => {
		expect(formatCell(usage, { usage: 5 })).toBe('5');
		expect(formatCell(kinds, { kinds: ['a', 'b'] })).toBe('a|b');
		expect(formatCell(byUsage, { usage: 0, by_usage: 3 })).toBe('');
		expect(formatCell(byUsage, { usage: 1, by_usage: 3 })).toBe('3');
	});

	it('describeField should join accepted values, default and requirement', () => {
		const fieldsById = mapFieldsById([usage, byUsage].map((field) => ({ field })));

		expect(describeField(usage, fieldsById)).toBe('Whole number from 0 to 100. Blank = 0');
		expect(describeField(byUsage, fieldsById)).toBe('Number. Blank = 0. Only applies when "Usage" is above 0');
	});

	it('getExampleValues should use defaults, fill lists and switch on dependencies', () => {
		const byEnabled = asField({
			id: 'by_enabled',
			label: 'By enabled',
			type: 'number',
			default: 0,
			disabled: falsy('enabled')
		});
		const fields = [usage, byUsage, enabled, byEnabled, kinds].map((field) => ({
			field,
			isPreRun: false,
			section: 'Section'
		}));

		expect(getExampleValues(fields, mapFieldsById(fields))).toEqual({
			usage: 50,
			by_usage: 0,
			enabled: true,
			by_enabled: 0,
			kinds: ['a', 'b']
		});
	});
});
