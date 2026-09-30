import type { DynamicFormSchema, SchemaField } from '$lib/components/dynamic-region-form/types';
import { mapFieldsById } from '$lib/components/dynamic-region-form/utils';
import { parseCsv } from '$lib/csv';
import {
	describeDependency,
	describeRequirement,
	failure,
	formatRowError,
	getCsvFields,
	invalidValue,
	isSetWhileDisabled,
	isSkippedRow,
	isSplitRow,
	labelOf,
	mapHeaderRow,
	parseCell,
	parseMultiselectCell,
	parseNumberCell,
	parseProjectCsv,
	parseRegion,
	parseRow,
	parseToggleCell,
	quoteHeader,
	validateFormValues,
	validateRegionName,
	type Column,
	type ParseContext
} from '$lib/server/projectCsv';
import { buildProjectCsvTemplate } from '$lib/server/projectCsvTemplate';
import { MOCK_FORM_SCHEMA } from '$mocks/mocks';

const schema = MOCK_FORM_SCHEMA as unknown as DynamicFormSchema;

const DEFAULT_FORM_VALUES = {
	population: 20000,
	is_seasonal: false,
	py_only: 0,
	py_pbo: 0,
	py_pyrrole: 0,
	py_ppf: 0,
	itn_future: 0,
	itn_future_types: [],
	routine_coverage: false,
	people_per_bednet: 1.8,
	people_per_household: 4,
	procurement_buffer: 7
};

const inlineSchema = (fields: object[]) =>
	({
		groups: [{ id: 'group', title: 'Group', subGroups: [{ id: 'subGroup', title: 'Sub group', fields }] }]
	}) as unknown as DynamicFormSchema;

const OPTIONS = [
	{ label: 'A', value: 'a' },
	{ label: 'B', value: 'b' },
	{ label: 'C', value: 'c' }
];
const falsy = (...fields: string[]) => ({ type: 'cross_field', fields, operator: 'falsy' });

const expectErrors = (csv: string, errors: string[]) => {
	expect(parseProjectCsv(csv, schema)).toEqual({ regions: [], errors });
};

const firstRegionValues = (csv: string) => {
	const { regions, errors } = parseProjectCsv(csv, schema);
	expect(errors).toEqual([]);
	return regions[0].formValues;
};

describe('parseProjectCsv', () => {
	it('should fill every unset field with its default', () => {
		const { regions, errors } = parseProjectCsv('Region\nNorth\n', schema);

		expect(errors).toEqual([]);
		expect(regions).toEqual([{ name: 'North', hasRunBaseline: false, formValues: DEFAULT_FORM_VALUES }]);
	});

	it('should keep the values that are set and default the rest', () => {
		expect(firstRegionValues('Region,Size of population,Seasonal transmission\nNorth,50000,true\n')).toEqual({
			...DEFAULT_FORM_VALUES,
			population: 50000,
			is_seasonal: true
		});
	});

	it('should read a region per row', () => {
		const { regions, errors } = parseProjectCsv('Region,Size of population\nNorth,50000\nSouth,60000\n', schema);

		expect(errors).toEqual([]);
		expect(regions.map((region) => region.name)).toEqual(['North', 'South']);
		expect(regions.map((region) => region.formValues.population)).toEqual([50000, 60000]);
	});

	describe('headers', () => {
		it('should match a column to the field whose label the template heads it with', () => {
			expect(firstRegionValues('Region,Size of population\nNorth,50000\n').population).toBe(50000);
		});

		// the headings come from the template, so anything else is a typo worth reporting rather than guessing at
		it.each(['size of population', 'size_of_population', 'population'])(
			'should not match "%s", which is not the label of a field',
			(header) => {
				expectErrors(`Region,${header}\nNorth,50000\n`, [`Column "${header}" is not recognised.`]);
			}
		);

		it('should ignore columns with a blank header and no values', () => {
			expect(firstRegionValues('Region,Size of population,\nNorth,50000,\n').population).toBe(50000);
		});
	});

	describe('file formats', () => {
		it('should read a semicolon separated file', () => {
			expect(
				firstRegionValues('Region;Size of population;Number of People per bed net\nNorth;20000;1.85\n')
			).toMatchObject({
				population: 20000,
				people_per_bednet: 1.85
			});
		});

		it('should read a tab separated file', () => {
			expect(firstRegionValues('Region\tSize of population\nNorth\t50000\n').population).toBe(50000);
		});

		it('should read a file with the lone CR line breaks of a Macintosh CSV', () => {
			const { regions } = parseProjectCsv('Region,Size of population\rNorth,1\rSouth,2\r', schema);

			expect(regions.map((region) => region.formValues.population)).toEqual([1, 2]);
		});

		it('should skip comment rows, whatever punctuation they hold', () => {
			const csv = '# Kenya; draft 2\nRegion,Size of population\n"# Help, this row is ignored",lots\nNorth,50000\n';

			expect(firstRegionValues(csv).population).toBe(50000);
		});

		it('should skip blank rows', () => {
			const { regions, errors } = parseProjectCsv('Region\nNorth\n\n,\nSouth\n', schema);

			expect(errors).toEqual([]);
			expect(regions.map((region) => region.name)).toEqual(['North', 'South']);
		});

		it('should reject a quote that is never closed', () => {
			expectErrors('Region,Size of population\n"North,50000\nSouth,6000\n', [
				'Row 2 has a quote (") that is never closed.'
			]);
		});
	});

	describe('numbers', () => {
		it.each([
			[' 45 ', 45],
			['4.5e1', 45],
			['+45', 45]
		])('should read "%s" as %s', (cell, expected) => {
			expect(firstRegionValues(`Region,Pyrethroid ITN population usage\nNorth,${cell}\n`).py_only).toBe(expected);
		});

		// numbers are written as they are in English, so a formatted or grouped cell is a mistake worth reporting
		it.each(['lots', '%', '0x10', 'Infinity', '45%', '$45', '1 000'])('should reject "%s"', (cell) => {
			expectErrors(`Region,Size of population\nNorth,${cell}\n`, [
				`Row 2: "Size of population" must be a number, but is "${cell}".`
			]);
		});

		it('should reject a thousands separator, which cannot be told from a decimal comma', () => {
			expectErrors('Region,Size of population\nNorth,"20,000"\n', [
				'Row 2: "Size of population" must be a number, but is "20,000".'
			]);
		});
	});

	describe('toggles', () => {
		it.each([
			['true', true],
			['TRUE', true],
			['false', false],
			['FALSE', false]
		])('should read "%s" as %s', (cell, expected) => {
			expect(firstRegionValues(`Region,Seasonal transmission\nNorth,${cell}\n`).is_seasonal).toBe(expected);
		});

		it.each(['sometimes', 'yes', 'no', '1', '0'])('should reject "%s"', (cell) => {
			expectErrors(`Region,Seasonal transmission\nNorth,${cell}\n`, [
				`Row 2: "Seasonal transmission" must be true or false, but is "${cell}".`
			]);
		});
	});

	describe('multiselects', () => {
		it.each([
			['py_only', ['py_only']],
			['py_only|py_pbo', ['py_only', 'py_pbo']],
			['py_only | py_pbo |', ['py_only', 'py_pbo']],
			['py_only|py_only', ['py_only']]
		])('should read %s as a single option or a list', (cell, expected) => {
			expect(
				firstRegionValues(`Region,Expected ITN population use,Future ITN Types\nNorth,50,${cell}\n`).itn_future_types
			).toEqual(expected);
		});

		// a list is only ever read from one cell, so a list a spreadsheet split is reported rather than guessed at
		it('should reject a list that a spreadsheet split into a cell per option', () => {
			expectErrors(
				'Region,Expected ITN population use,Future ITN Types,Continuous distribution of ITNs\nNorth,50,py_only,py_pbo,true\n',
				[
					'Row 2: there are more values than column headings - wrap any value containing a comma or semicolon in quotes.'
				]
			);
		});

		it('should read a list held in one quoted cell', () => {
			const csv =
				'Region,Expected ITN population use,Future ITN Types,Continuous distribution of ITNs\nNorth,50,"py_only|py_pbo",true\n';

			expect(firstRegionValues(csv)).toMatchObject({ itn_future_types: ['py_only', 'py_pbo'], routine_coverage: true });
		});

		it('should read adjacent list columns as a value each', () => {
			const adjacentLists = inlineSchema([
				{ id: 'first', label: 'First', type: 'multiselect', options: OPTIONS },
				{ id: 'second', label: 'Second', type: 'multiselect', options: OPTIONS }
			]);

			const { regions } = parseProjectCsv('Region,First,Second\nNorth,a,b\n', adjacentLists);

			expect(regions[0].formValues).toEqual({ first: ['a'], second: ['b'] });
		});

		it('should reject an unknown option', () => {
			expectErrors('Region,Expected ITN population use,Future ITN Types\nNorth,50,py_magic\n', [
				'Row 2: "Future ITN Types" has no option "py_magic". Valid options are py_only, py_pbo, py_pyrrole, py_ppf, with several separated by "|".'
			]);
		});
	});

	describe('fields that depend on other fields', () => {
		it('should reject ITN types when there is no ITN usage, as the nets would still be costed', () => {
			expectErrors('Region,Expected ITN population use,Future ITN Types\nNorth,0,py_only\n', [
				'Row 2: "Future ITN Types" only applies when "Expected ITN population use" is above 0.'
			]);
		});

		it('should reject switching on continuous distribution when there is no ITN usage', () => {
			expectErrors('Region,Continuous distribution of ITNs\nNorth,true\n', [
				'Row 2: "Continuous distribution of ITNs" only applies when "Expected ITN population use" is above 0.'
			]);
		});

		it.each([
			['all', 'when "One" is 0 or "Two" is false'],
			['any', 'when "One" is 0 and "Two" is false']
		])('should explain a field disabled while %s of its dependencies are on', (operator, requirement) => {
			const dependencies = inlineSchema([
				{ id: 'one', label: 'One', type: 'number', default: 1 },
				{ id: 'two', label: 'Two', type: 'toggle', default: true },
				{
					id: 'dependent',
					label: 'Dependent',
					type: 'number',
					default: 0,
					disabled: { type: 'cross_field', fields: ['one', 'two'], operator }
				}
			]);

			expect(parseProjectCsv('Region,Dependent\nNorth,5\n', dependencies).errors).toEqual([
				`Row 2: "Dependent" only applies ${requirement}.`
			]);
		});

		it('should reject a value for a field that is always disabled', () => {
			const locked = inlineSchema([{ id: 'locked', label: 'Locked', type: 'number', default: 0, disabled: true }]);

			expect(parseProjectCsv('Region,Locked\nNorth,5\n', locked).errors).toEqual(['Row 2: "Locked" cannot be set.']);
		});

		it('should accept a dependent field left off or at its default', () => {
			expect(firstRegionValues('Region,Continuous distribution of ITNs,Future ITN Types\nNorth,false,\n')).toEqual(
				DEFAULT_FORM_VALUES
			);
		});

		it('should accept dependent fields once the field they depend on is set', () => {
			expect(
				firstRegionValues(
					'Region,Expected ITN population use,Future ITN Types,Continuous distribution of ITNs\nNorth,50,py_ppf,true\n'
				)
			).toMatchObject({ itn_future: 50, itn_future_types: ['py_ppf'], routine_coverage: true });
		});
	});

	describe('errors', () => {
		it('should reject an empty file', () => {
			expectErrors('', ['The CSV file is empty.']);
		});

		it('should reject a file with a header but no regions', () => {
			expectErrors('Region,Size of population\n# just a note\n', ['The CSV file does not list any regions.']);
		});

		it('should name an unrecognised column', () => {
			expectErrors('Region,populaton\nNorth,50000\n', ['Column "populaton" is not recognised.']);
		});

		it('should reject a display field column, which the form derives', () => {
			expectErrors('Region,itn_total\nNorth,10\n', ['Column "itn_total" is not recognised.']);
		});

		it('should reject a repeated column', () => {
			expectErrors('Region,Size of population,Size of population\nNorth,1,2\n', [
				'Column "Size of population" appears more than once.'
			]);
		});

		it('should explain a row split by an unquoted comma', () => {
			expectErrors('Region,Size of population\nNorth, East,50000\n', [
				'Row 2: there are more values than column headings - wrap any value containing a comma or semicolon in quotes.'
			]);
		});

		it('should reject a value under a blank heading', () => {
			expectErrors('Region,,Size of population\nNorth,stray,50000\n', [
				'Row 2: there are more values than column headings - wrap any value containing a comma or semicolon in quotes.'
			]);
		});

		it('should reject a row without a region name', () => {
			expectErrors('Region,Size of population\n,50000\n', ['Row 2: a region name is required.']);
		});

		it.each(['North/South', 'North\\South', 'Why?', 'District #1', '100% covered'])(
			'should reject the region name "%s", which would break its URL',
			(name) => {
				expectErrors(`Region\n"${name}"\n`, ['Row 2: region names cannot contain / \\ ? # or %.']);
			}
		);

		it('should reject a repeated region name', () => {
			expectErrors('Region\nNorth\n North \n', ['Row 3: region "North" is listed more than once.']);
		});

		it('should reject a value outside the range of its field', () => {
			expectErrors('Region,Pyrethroid ITN population usage\nNorth,120\n', [
				'Row 2: Pyrethroid ITN population usage must be ≤ 100.',
				'Row 2: Total ITN population usage must be less than or equal to 100% (from "Pyrethroid ITN population usage": 120, "Pyrethroid-PBO ITN population usage": 0, "Pyrethroid-Pyrrole ITN population usage": 0, "Pyrethroid-pyriproxyfen ITN population usage": 0).'
			]);
		});

		it('should reject a non-integer value for an integer field', () => {
			expectErrors('Region,Size of population\nNorth,1.5\n', ['Row 2: Size of population must be an integer.']);
		});

		it('should apply the cross field validation rules of the schema', () => {
			expectErrors('Region,Pyrethroid ITN population usage,Pyrethroid-PBO ITN population usage\nNorth,60,60\n', [
				'Row 2: Total ITN population usage must be less than or equal to 100% (from "Pyrethroid ITN population usage": 60, "Pyrethroid-PBO ITN population usage": 60, "Pyrethroid-Pyrrole ITN population usage": 0, "Pyrethroid-pyriproxyfen ITN population usage": 0).'
			]);
		});

		// blank lines are dropped as the file is read, so they are the one thing a row number does not count
		it('should number rows counting comment rows, as a spreadsheet does', () => {
			expectErrors('# note\nRegion,Size of population\nNorth,lots\n', [
				'Row 3: "Size of population" must be a number, but is "lots".'
			]);
		});

		it('should report the row that is wrong and return no regions at all', () => {
			expectErrors('Region,Size of population\nNorth,50000\nSouth,lots\n', [
				'Row 3: "Size of population" must be a number, but is "lots".'
			]);
		});

		it('should cap the number of reported problems', () => {
			const rows = Array.from({ length: 12 }, (_, index) => `Region ${index},lots`).join('\n');
			const { errors } = parseProjectCsv(`Region,Size of population\n${rows}\n`, schema);

			expect(errors).toHaveLength(11);
			expect(errors[10]).toBe('...and 2 more problems.');
		});
	});
});

describe('buildProjectCsvTemplate', () => {
	const [header, section, help, allParameters, baselineOnly] = parseCsv(buildProjectCsvTemplate(schema));

	it('should have a region column followed by a column per editable field', () => {
		expect(header).toEqual([
			'Region',
			'Size of population',
			'Seasonal transmission',
			'Pyrethroid ITN population usage',
			'Pyrethroid-PBO ITN population usage',
			'Pyrethroid-Pyrrole ITN population usage',
			'Pyrethroid-pyriproxyfen ITN population usage',
			'Expected ITN population use',
			'Future ITN Types',
			'Continuous distribution of ITNs',
			'Number of People per bed net',
			'Number of People per household',
			'Procurement Buffer'
		]);
	});

	it('should name the form section of each column, so a column can be tied to its group', () => {
		expect(section).toEqual([
			'# Section - this row is ignored. Where each field is in the form',
			'Baseline Options: Site Inputs',
			'Baseline Options: Site Inputs',
			'Baseline Options: Past Vector Control',
			'Baseline Options: Past Vector Control',
			'Baseline Options: Past Vector Control',
			'Baseline Options: Past Vector Control',
			'Intervention Options: Future Intervention Options',
			'Intervention Options: Future Intervention Options',
			'Intervention Options: Future Intervention Options',
			'Cost Options: Procurement and Distribution Costs',
			'Cost Options: Procurement and Distribution Costs',
			'Cost Options: Procurement and Distribution Costs'
		]);
	});

	it('should name a section once when its group and sub group share a heading', () => {
		const sameHeading = {
			groups: [
				{
					id: 'g',
					title: 'Costs',
					subGroups: [{ id: 's', title: 'Costs', fields: [{ id: 'a', label: 'A', type: 'number' }] }]
				}
			]
		} as unknown as DynamicFormSchema;

		expect(parseCsv(buildProjectCsvTemplate(sameHeading))[1].slice(1)).toEqual(['Costs']);
	});

	it('should describe what each column accepts in a help row', () => {
		expect(help).toEqual([
			'# Help - this row is ignored. A unique region name, which cannot contain / \\ ? # or %',
			'Whole number from 0 to 1000000000. Blank = 20000',
			'true or false. Blank = false',
			'Whole number from 0 to 100 (%). Blank = 0',
			'Whole number from 0 to 100 (%). Blank = 0',
			'Whole number from 0 to 100 (%). Blank = 0',
			'Whole number from 0 to 100 (%). Blank = 0',
			'Whole number from 0 to 100 (%). Blank = 0',
			'One or more of py_only, py_pbo, py_pyrrole, py_ppf - separate several with "|". Blank = none. Only applies when "Expected ITN population use" is above 0',
			'true or false. Blank = false. Only applies when "Expected ITN population use" is above 0',
			'Number. Blank = 1.8',
			'Number. Blank = 4',
			'Whole number from 0 to 100 (%). Blank = 7'
		]);
	});

	it('should switch on the fields that others depend on, so the example that sets everything is consistent', () => {
		expect(allParameters).toEqual([
			'Example region - all parameters',
			'20000',
			'false',
			'0',
			'0',
			'0',
			'0',
			'50',
			'py_only|py_pbo',
			'false',
			'1.8',
			'4',
			'7'
		]);
	});

	it('should leave everything but the baseline blank in the baseline only example', () => {
		expect(baselineOnly).toEqual([
			'Example region - baseline only',
			'20000',
			'false',
			'0',
			'0',
			'0',
			'0',
			'',
			'',
			'',
			'',
			'',
			''
		]);
	});

	it('should write a list into one cell, separated so that no spreadsheet splits it', () => {
		expect(buildProjectCsvTemplate(schema)).toContain(',py_only|py_pbo,');
	});

	it('should describe ranges that are open at either end', () => {
		const openRanges = inlineSchema([
			{ id: 'at_least', label: 'At least', type: 'number', min: 1, default: 1 },
			{ id: 'at_most', label: 'At most', type: 'number', max: 9, default: 1, unit: '%' }
		]);

		expect(parseCsv(buildProjectCsvTemplate(openRanges))[2].slice(1)).toEqual([
			'Number of 1 or more. Blank = 1',
			'Number of 9 or less (%). Blank = 1'
		]);
	});

	it('should switch on the toggles and lists that other fields depend on', () => {
		const dependencies = inlineSchema([
			{ id: 'by_list', label: 'By list', type: 'number', default: 0, disabled: falsy('kinds') },
			{ id: 'by_toggle', label: 'By toggle', type: 'number', default: 0, disabled: falsy('enabled') },
			{ id: 'enabled', label: 'Enabled', type: 'toggle', default: false },
			{ id: 'kinds', label: 'Kinds', type: 'multiselect', options: OPTIONS }
		]);

		const [, , help, example] = parseCsv(buildProjectCsvTemplate(dependencies));

		expect(help.slice(1, 3)).toEqual([
			'Number. Blank = 0. Only applies when "Kinds" has a value',
			'Number. Blank = 0. Only applies when "Enabled" is true'
		]);
		expect(example.slice(1)).toEqual(['0', '0', 'true', 'a|b']);
	});

	it('should leave a field that stays disabled blank in the examples', () => {
		const alwaysDisabled = inlineSchema([
			{ id: 'shown', label: 'Shown', type: 'number', default: 1 },
			{ id: 'locked', label: 'Locked', type: 'number', default: 2, disabled: true }
		]);

		expect(parseCsv(buildProjectCsvTemplate(alwaysDisabled))[3]).toEqual(['Example region - all parameters', '1', '']);
	});

	it('should leave out hidden fields', () => {
		const withHiddenField = inlineSchema([
			{ id: 'shown', label: 'Shown', type: 'number', default: 1 },
			{ id: 'secret', label: 'Secret', type: 'number', default: 2, hidden: true }
		]);

		expect(parseCsv(buildProjectCsvTemplate(withHiddenField))[0]).toEqual(['Region', 'Shown']);
	});

	it('should produce a template that parses back into its example regions', () => {
		const { regions, errors } = parseProjectCsv(buildProjectCsvTemplate(schema), schema);

		expect(errors).toEqual([]);
		expect(regions.map((region) => region.name)).toEqual([
			'Example region - all parameters',
			'Example region - baseline only'
		]);
		expect(regions[0].formValues).toMatchObject({ itn_future: 50, itn_future_types: ['py_only', 'py_pbo'] });
		expect(regions[1].formValues).toEqual(DEFAULT_FORM_VALUES);
	});
});

describe('projectCsv helpers', () => {
	const asField = (field: object) => field as unknown as SchemaField;
	const population = asField({ id: 'population', label: ' Population ', type: 'number', default: 0, max: 100 });
	const seasonal = asField({ id: 'seasonal', label: 'Seasonal', type: 'toggle', default: false });
	const kinds = asField({ id: 'kinds', label: 'Kinds', type: 'multiselect', options: OPTIONS });
	const dependent = asField({
		id: 'dependent',
		label: 'Dependent',
		type: 'number',
		default: 0,
		disabled: falsy('population')
	});
	const csvFields = [population, seasonal, kinds, dependent].map((field) => ({
		field,
		isPreRun: false,
		section: 'Section'
	}));
	const fieldsById = mapFieldsById(csvFields);
	const columns: Column[] = [
		{ kind: 'region' },
		{ kind: 'field', field: population },
		{ kind: 'field', field: seasonal },
		null
	];
	const context: ParseContext = {
		columns,
		fields: csvFields,
		fieldsById,
		schema: inlineSchema(csvFields.map(({ field }) => field))
	};

	it('labelOf should quote the trimmed label', () => {
		expect(labelOf(population)).toBe('"Population"');
	});

	it('getCsvFields should leave out display and hidden fields, flag pre-run groups and name sections', () => {
		const withPreRun = {
			groups: [
				{
					id: 'baseline',
					title: 'Baseline',
					preRun: true,
					subGroups: [
						{
							id: 'sub',
							title: 'Inputs',
							fields: [
								{ id: 'a', label: 'A', type: 'number' },
								{ id: 'b', label: 'B', type: 'display' },
								{ id: 'c', label: 'C', type: 'number', hidden: true }
							]
						}
					]
				},
				{
					id: 'other',
					title: 'Other',
					subGroups: [{ id: 'sub', title: 'Other', fields: [{ id: 'd', label: 'D', type: 'toggle' }] }]
				}
			]
		} as unknown as DynamicFormSchema;

		expect(getCsvFields(withPreRun).map(({ field, isPreRun, section }) => [field.id, isPreRun, section])).toEqual([
			['a', true, 'Baseline: Inputs'],
			['d', false, 'Other']
		]);
	});

	it.each([
		[['', ' '], true],
		[['# note', 'x'], true],
		[['#', 'x'], true],
		[['#1', 'x'], true],
		[['North #1', 'x'], false],
		[['North', ''], false]
	])('isSkippedRow(%j) should be %s', (row, expected) => {
		expect(isSkippedRow(row)).toBe(expected);
	});

	it('quoteHeader should quote a short header and truncate a long one', () => {
		expect(quoteHeader('Short')).toBe('"Short"');
		expect(quoteHeader('x'.repeat(45))).toBe(`"${'x'.repeat(40)}..."`);
	});

	it('mapHeaderRow should map headers to columns and report unknown and repeated ones', () => {
		expect(mapHeaderRow(['Region', 'Population', '', 'Nope', 'Seasonal', 'Seasonal'], csvFields)).toEqual({
			columns: [
				{ kind: 'region' },
				{ kind: 'field', field: population },
				null,
				null,
				{ kind: 'field', field: seasonal },
				null
			],
			errors: ['Column "Nope" is not recognised.', 'Column "Seasonal" appears more than once.']
		});
	});

	it('invalidValue should describe what was expected', () => {
		expect(invalidValue(seasonal, 'true or false', 'maybe')).toEqual({
			error: '"Seasonal" must be true or false, but is "maybe"'
		});
	});

	it('parseNumberCell should read numbers and reject anything else', () => {
		expect(parseNumberCell(population as never, '-1.5e2')).toEqual({ value: -150 });
		expect(parseNumberCell(population as never, '1,5')).toEqual({
			error: '"Population" must be a number, but is "1,5"'
		});
	});

	it('parseToggleCell should read true and false in any case', () => {
		expect(parseToggleCell(seasonal as never, 'True')).toEqual({ value: true });
		expect(parseToggleCell(seasonal as never, 'FALSE')).toEqual({ value: false });
		expect(parseToggleCell(seasonal as never, 'yes')).toEqual({
			error: '"Seasonal" must be true or false, but is "yes"'
		});
	});

	it('parseMultiselectCell should split, trim and dedupe options', () => {
		expect(parseMultiselectCell(kinds as never, ' b | a |b|')).toEqual({ value: ['b', 'a'] });
		expect(parseMultiselectCell(kinds as never, 'a|z')).toEqual({
			error: '"Kinds" has no option "z". Valid options are a, b, c, with several separated by "|"'
		});
	});

	it('parseCell should dispatch on field type and reject fields that cannot be set', () => {
		expect(parseCell(population, '5')).toEqual({ value: 5 });
		expect(parseCell(seasonal, 'true')).toEqual({ value: true });
		expect(parseCell(kinds, 'c')).toEqual({ value: ['c'] });
		expect(parseCell(asField({ id: 'd', label: 'Derived', type: 'display' }), '1')).toEqual({
			error: '"Derived" cannot be set from a CSV'
		});
	});

	it('isSplitRow should flag a value under a blank or missing column', () => {
		expect(isSplitRow(['North', '1', 'true', ''], columns)).toBe(false);
		expect(isSplitRow(['North', '1', 'true', 'x'], columns)).toBe(true);
		expect(isSplitRow(['North', '1', 'true', '', 'x'], columns)).toBe(true);
	});

	it('parseRow should read the name and supplied values, collecting cell errors', () => {
		expect(parseRow([' North ', '5', ''], columns)).toEqual({ name: 'North', values: { population: 5 }, errors: [] });
		expect(parseRow(['North', 'lots', 'true'], columns)).toEqual({
			name: 'North',
			values: { seasonal: true },
			errors: ['"Population" must be a number, but is "lots"']
		});
	});

	it.each([
		['population', true, '"Population" is above 0'],
		['population', false, '"Population" is 0'],
		['seasonal', true, '"Seasonal" is true'],
		['kinds', true, '"Kinds" has a value'],
		['kinds', false, '"Kinds" is blank'],
		['unknown', true, '"unknown" is above 0']
	])('describeDependency(%s, %s) should be %s', (id, isOn, expected) => {
		expect(describeDependency(id, isOn, fieldsById)).toBe(expected);
	});

	it('describeRequirement should be null unless the field depends on others', () => {
		expect(describeRequirement(population, fieldsById)).toBeNull();
		expect(describeRequirement(asField({ ...population, disabled: true }), fieldsById)).toBeNull();
		expect(describeRequirement(dependent, fieldsById)).toBe('when "Population" is above 0');
	});

	it('isSetWhileDisabled should only flag a non-default value on a disabled field', () => {
		const off = { population: 0, dependent: 0 };
		expect(isSetWhileDisabled(dependent, 5, off)).toBe(true);
		expect(isSetWhileDisabled(dependent, undefined, off)).toBe(false);
		expect(isSetWhileDisabled(dependent, 0, off)).toBe(false);
		expect(isSetWhileDisabled(dependent, 5, { population: 1, dependent: 5 })).toBe(false);
	});

	it('isSetWhileDisabled should flag a falsy value that differs from a non-zero default', () => {
		const withDefault = asField({
			id: 'with_default',
			label: 'With default',
			type: 'number',
			default: 5,
			disabled: falsy('population')
		});
		const off = { population: 0, with_default: 5 };
		expect(isSetWhileDisabled(withDefault, 0, off)).toBe(true);
		expect(isSetWhileDisabled(withDefault, 5, off)).toBe(false);

		const toggleDefaultOn = asField({
			id: 'toggle_on',
			label: 'Toggle on',
			type: 'toggle',
			default: true,
			disabled: falsy('population')
		});
		expect(isSetWhileDisabled(toggleDefaultOn, false, { population: 0, toggle_on: true })).toBe(true);
	});

	it('validateFormValues should report field, disabled and custom rule errors', () => {
		const withRule: ParseContext = {
			...context,
			schema: {
				...context.schema,
				customValidationRules: {
					rule: { type: 'cross_field', fields: ['population'], operator: 'sum_lte', threshold: 50, message: 'Too many' }
				}
			} as unknown as DynamicFormSchema
		};
		const formValues = { population: 0, seasonal: false, kinds: [], dependent: 3 };

		expect(validateFormValues({ dependent: 3 }, formValues, context)).toEqual([
			'"Dependent" only applies when "Population" is above 0'
		]);
		expect(validateFormValues({}, { ...formValues, population: 200, dependent: 0 }, context)).toEqual([
			' Population  must be ≤ 100'
		]);
		expect(validateFormValues({}, { ...formValues, population: 60, dependent: 0 }, withRule)).toEqual([
			'Too many (from "Population": 60)'
		]);
	});

	it('validateRegionName should require a unique, URL safe name', () => {
		const regions = [{ name: 'North', formValues: {}, hasRunBaseline: false }];
		expect(validateRegionName('South', regions)).toBeNull();
		expect(validateRegionName('', regions)).toBe('a region name is required');
		expect(validateRegionName('a/b', regions)).toBe('region names cannot contain / \\ ? # or %');
		expect(validateRegionName('North', regions)).toBe('region "North" is listed more than once');
	});

	it('parseRegion should build a region with defaults filled in', () => {
		expect(parseRegion(['North', '5', ''], context, [])).toEqual({
			region: {
				name: 'North',
				hasRunBaseline: false,
				formValues: { population: 5, seasonal: false, kinds: [], dependent: 0 }
			}
		});
	});

	it('parseRegion should report only the split row error for a split row', () => {
		expect(parseRegion(['', 'lots', 'x', 'extra'], context, [])).toEqual({
			errors: ['there are more values than column headings - wrap any value containing a comma or semicolon in quotes']
		});
	});

	it('formatRowError should prefix the row and end with a single full stop', () => {
		expect(formatRowError(3, 'bad value')).toBe('Row 3: bad value.');
		expect(formatRowError(3, 'bad value.')).toBe('Row 3: bad value.');
	});

	it('failure should return no regions and cap the errors', () => {
		expect(failure(['a'])).toEqual({ regions: [], errors: ['a'] });
		const errors = Array.from({ length: 13 }, (_, index) => `e${index}`);
		expect(failure(errors).errors).toEqual([...errors.slice(0, 10), '...and 3 more problems.']);
	});
});
