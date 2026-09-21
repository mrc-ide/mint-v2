import type { DynamicFormSchema } from '$lib/components/dynamic-region-form/types';
import { parseCsv } from '$lib/csv';
import { parseProjectCsv } from '$lib/server/projectCsv';
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
	({ groups: [{ id: 'group', subGroups: [{ id: 'subGroup', fields }] }] }) as unknown as DynamicFormSchema;

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
		expect(firstRegionValues('Region,population,is_seasonal\nNorth,50000,true\n')).toEqual({
			...DEFAULT_FORM_VALUES,
			population: 50000,
			is_seasonal: true
		});
	});

	it('should read a region per row', () => {
		const { regions, errors } = parseProjectCsv('Region,population\nNorth,50000\nSouth,60000\n', schema);

		expect(errors).toEqual([]);
		expect(regions.map((region) => region.name)).toEqual(['North', 'South']);
		expect(regions.map((region) => region.formValues.population)).toEqual([50000, 60000]);
	});

	describe('headers', () => {
		it.each(['Size of population', 'size_of_population', 'SIZE OF POPULATION!', 'population'])(
			'should match "%s" to its field, ignoring case, spacing and punctuation',
			(header) => {
				expect(firstRegionValues(`Region,${header}\nNorth,50000\n`).population).toBe(50000);
			}
		);

		it.each(['Region', 'region', 'Region Name', 'region_name', 'Name'])(
			'should accept "%s" as the region column',
			(header) => {
				const { regions, errors } = parseProjectCsv(`${header}\nNorth\n`, schema);

				expect(errors).toEqual([]);
				expect(regions[0].name).toBe('North');
			}
		);

		it('should match ids before labels, so a label cannot hide another field', () => {
			const clashing = inlineSchema([
				{ id: 'size', label: 'Size', type: 'number', default: 1 },
				{ id: 'other', label: 'size', type: 'number', default: 2 }
			]);

			const { regions } = parseProjectCsv('Region,size\nNorth,5\n', clashing);

			expect(regions[0].formValues).toEqual({ size: 5, other: 2 });
		});

		it('should ignore columns with a blank header and no values', () => {
			expect(firstRegionValues('Region,population,\nNorth,50000,\n').population).toBe(50000);
		});
	});

	describe('file formats', () => {
		it('should read a semicolon separated file with decimal commas and grouped thousands', () => {
			expect(firstRegionValues('Region;population;people_per_bednet\nNorth;20 000;1,85\n')).toMatchObject({
				population: 20000,
				people_per_bednet: 1.85
			});
		});

		it('should read a tab separated file', () => {
			expect(firstRegionValues('Region\tpopulation\nNorth\t50000\n').population).toBe(50000);
		});

		it('should read a file with the lone CR line breaks of a Macintosh CSV', () => {
			const { regions } = parseProjectCsv('Region,population\rNorth,1\rSouth,2\r', schema);

			expect(regions.map((region) => region.formValues.population)).toEqual([1, 2]);
		});

		it('should skip comment rows, whatever punctuation they hold', () => {
			const csv = '# Kenya; draft 2\nRegion,population\n"# Help, this row is ignored",lots\nNorth,50000\n';

			expect(firstRegionValues(csv).population).toBe(50000);
		});

		it('should skip blank rows', () => {
			const { regions, errors } = parseProjectCsv('Region\nNorth\n\n,\nSouth\n', schema);

			expect(errors).toEqual([]);
			expect(regions.map((region) => region.name)).toEqual(['North', 'South']);
		});

		it('should reject a spreadsheet workbook uploaded in place of a CSV', () => {
			expectErrors(`PK${String.fromCharCode(3, 4)}binary`, [
				'This is a spreadsheet workbook, not a CSV file. Save it as CSV and upload that file instead.'
			]);
		});

		it('should reject a quote that is never closed', () => {
			expectErrors('Region,population\n"North,50000\nSouth,6000\n', ['Row 2 has a quote (") that is never closed.']);
		});
	});

	describe('numbers', () => {
		it.each([
			['45%', 45],
			[' 45 ', 45],
			['4.5e1', 45],
			['+45', 45]
		])('should read "%s" as %s', (cell, expected) => {
			expect(firstRegionValues(`Region,py_only\nNorth,${cell}\n`).py_only).toBe(expected);
		});

		it('should read a cell formatted as currency', () => {
			expect(firstRegionValues('Region,people_per_bednet\nNorth,$1.85\n').people_per_bednet).toBe(1.85);
		});

		it('should read thousands separators in whole numbers', () => {
			expect(firstRegionValues('Region,population\nNorth,"20,000"\n').population).toBe(20000);
		});

		it('should reject a decimal comma in a comma separated file, as it cannot be told from thousands', () => {
			expectErrors('Region,people_per_bednet\nNorth,"1,800"\n', [
				'Row 2: "Number of People per bed net" must be a number, but is "1,800" - write decimals with "." and leave out thousands separators.'
			]);
		});

		it.each(['lots', '%', '0x10', 'Infinity'])('should reject "%s"', (cell) => {
			expectErrors(`Region,population\nNorth,${cell}\n`, [
				`Row 2: "Size of population" must be a number, but is "${cell}".`
			]);
		});
	});

	describe('toggles', () => {
		it.each([
			['true', true],
			['TRUE', true],
			['Yes', true],
			['on', true],
			['1', true],
			['1.0', true],
			['VRAI', true],
			['false', false],
			['no', false],
			['OFF', false],
			['0', false],
			['0.0', false],
			['FAUX', false]
		])('should read "%s" as %s', (cell, expected) => {
			expect(firstRegionValues(`Region,is_seasonal\nNorth,${cell}\n`).is_seasonal).toBe(expected);
		});

		it('should reject a value that is not a toggle', () => {
			expectErrors('Region,is_seasonal\nNorth,sometimes\n', [
				'Row 2: "Seasonal transmission" must be true or false, but is "sometimes".'
			]);
		});
	});

	describe('multiselects', () => {
		it.each([
			['py_only', ['py_only']],
			['Pyrethroid ITNs', ['py_only']],
			['py_only|py_pbo', ['py_only', 'py_pbo']],
			['py_only;py_pbo', ['py_only', 'py_pbo']],
			['"py_only, py_pbo"', ['py_only', 'py_pbo']],
			['py_only | Pyrethroid-PBO ITNs |', ['py_only', 'py_pbo']],
			['"[""py_only"", ""py_pbo""]"', ['py_only', 'py_pbo']],
			['pyrethroid pbo itns', ['py_pbo']],
			['py_only|py_only', ['py_only']]
		])('should read %s as a single option or a list', (cell, expected) => {
			expect(firstRegionValues(`Region,itn_future,itn_future_types\nNorth,50,${cell}\n`).itn_future_types).toEqual(
				expected
			);
		});

		it('should rejoin a list that a spreadsheet split into a cell per option', () => {
			const csv = 'Region,itn_future,itn_future_types,routine_coverage\nNorth,50,py_only,Pyrethroid-PBO ITNs,true\n';

			expect(firstRegionValues(csv)).toMatchObject({ itn_future_types: ['py_only', 'py_pbo'], routine_coverage: true });
		});

		it('should rejoin a split list in a row that the spreadsheet kept the same length', () => {
			// saving drops a trailing blank to make room for the extra cell, so the row is no longer than the header
			const csv =
				'Region,itn_future,itn_future_types,routine_coverage,population,\nNorth,50,py_only,py_pbo,py_ppf,false,50000\n';

			expect(firstRegionValues(csv)).toMatchObject({
				itn_future_types: ['py_only', 'py_pbo', 'py_ppf'],
				routine_coverage: false,
				population: 50000
			});
		});

		it('should rejoin a split list whose pieces land in the region column', () => {
			const { regions, errors } = parseProjectCsv(
				'itn_future,itn_future_types,Region\n50,py_only,py_pbo,North\n',
				schema
			);

			expect(errors).toEqual([]);
			expect(regions[0]).toMatchObject({ name: 'North', formValues: { itn_future_types: ['py_only', 'py_pbo'] } });
		});

		it('should not take a value that belongs in the next column, even when it is also an option', () => {
			const adjacentLists = inlineSchema([
				{ id: 'first', label: 'First', type: 'multiselect', options: OPTIONS },
				{ id: 'second', label: 'Second', type: 'multiselect', options: OPTIONS }
			]);

			const { regions } = parseProjectCsv('Region,first,second\nNorth,a,b\n', adjacentLists);

			expect(regions[0].formValues).toEqual({ first: ['a'], second: ['b'] });
		});

		it('should rejoin a split list with a mistyped option, to report the typo rather than shifted columns', () => {
			expectErrors('Region,itn_future,itn_future_types,routine_coverage\nNorth,50,py_onyl,py_pbo,true\n', [
				'Row 2: "Future ITN Types" has no option "py_onyl". Valid options are py_only, py_pbo, py_pyrrole, py_ppf, with several separated by "|".'
			]);
		});

		it('should reject an unknown option', () => {
			expectErrors('Region,itn_future,itn_future_types\nNorth,50,py_magic\n', [
				'Row 2: "Future ITN Types" has no option "py_magic". Valid options are py_only, py_pbo, py_pyrrole, py_ppf, with several separated by "|".'
			]);
		});
	});

	describe('fields that depend on other fields', () => {
		it('should reject ITN types when there is no ITN usage, as the nets would still be costed', () => {
			expectErrors('Region,itn_future,itn_future_types\nNorth,0,py_only\n', [
				'Row 2: "Future ITN Types" only applies when "Expected ITN population use" is above 0.'
			]);
		});

		it('should reject switching on continuous distribution when there is no ITN usage', () => {
			expectErrors('Region,routine_coverage\nNorth,true\n', [
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

			expect(parseProjectCsv('Region,dependent\nNorth,5\n', dependencies).errors).toEqual([
				`Row 2: "Dependent" only applies ${requirement}.`
			]);
		});

		it('should reject a value for a field that is always disabled', () => {
			const locked = inlineSchema([{ id: 'locked', label: 'Locked', type: 'number', default: 0, disabled: true }]);

			expect(parseProjectCsv('Region,locked\nNorth,5\n', locked).errors).toEqual(['Row 2: "Locked" cannot be set.']);
		});

		it('should accept a dependent field left off or at its default', () => {
			expect(firstRegionValues('Region,routine_coverage,itn_future_types\nNorth,false,\n')).toEqual(
				DEFAULT_FORM_VALUES
			);
		});

		it('should accept dependent fields once the field they depend on is set', () => {
			expect(
				firstRegionValues('Region,itn_future,itn_future_types,routine_coverage\nNorth,50,py_ppf,true\n')
			).toMatchObject({ itn_future: 50, itn_future_types: ['py_ppf'], routine_coverage: true });
		});
	});

	describe('errors', () => {
		it('should reject an empty file', () => {
			expectErrors('', ['The CSV file is empty.']);
		});

		it('should reject a file with a header but no regions', () => {
			expectErrors('Region,population\n# just a note\n', ['The CSV file does not list any regions.']);
		});

		it('should reject a file without a region column', () => {
			expectErrors('population\n50000\n', [
				'The first row must hold the column headings, including a "Region" column.'
			]);
		});

		it('should name an unrecognised column', () => {
			expectErrors('Region,populaton\nNorth,50000\n', ['Column "populaton" is not recognised.']);
		});

		it('should reject a display field column, which the form derives', () => {
			expectErrors('Region,itn_total\nNorth,10\n', ['Column "itn_total" is not recognised.']);
		});

		it('should explain a file whose headings are mostly unrecognised in one message', () => {
			expectErrors('Region population people_per_bednet\nNorth 5 1\n', [
				'Most column headings were not recognised, such as "Region population people_per_bednet". The first row must hold the headings from the template, and the file must be saved as a CSV separated by commas or semicolons.'
			]);
		});

		it('should reject a repeated column, whether by id or by label', () => {
			expectErrors('Region,population,Size of population\nNorth,1,2\n', [
				'Column "Size of population" appears more than once.'
			]);
		});

		it('should explain a row split by an unquoted comma', () => {
			expectErrors('Region,population\nNorth, East,50000\n', [
				'Row 2: there are more values than column headings - wrap any value containing a comma or semicolon in quotes.'
			]);
		});

		it('should reject a value under a blank heading', () => {
			expectErrors('Region,,population\nNorth,stray,50000\n', [
				'Row 2: there are more values than column headings - wrap any value containing a comma or semicolon in quotes.'
			]);
		});

		it('should reject a row without a region name', () => {
			expectErrors('Region,population\n,50000\n', ['Row 2: a region name is required.']);
		});

		it.each(['North/South', 'North\\South', 'Why?', '#1 District', '100% covered'])(
			'should reject the region name "%s", which would break its URL',
			(name) => {
				expectErrors(`Region\n"${name}"\n`, ['Row 2: region names cannot contain / \\ ? # or %.']);
			}
		);

		it('should reject a repeated region name', () => {
			expectErrors('Region\nNorth\n North \n', ['Row 3: region "North" is listed more than once.']);
		});

		it('should reject a value outside the range of its field', () => {
			expectErrors('Region,py_only\nNorth,120\n', [
				'Row 2: Pyrethroid ITN population usage must be ≤ 100.',
				'Row 2: Total ITN population usage must be less than or equal to 100%.'
			]);
		});

		it('should reject a non-integer value for an integer field', () => {
			expectErrors('Region,population\nNorth,1.5\n', ['Row 2: Size of population must be an integer.']);
		});

		it('should apply the cross field validation rules of the schema', () => {
			expectErrors('Region,py_only,py_pbo\nNorth,60,60\n', [
				'Row 2: Total ITN population usage must be less than or equal to 100%.'
			]);
		});

		it('should number rows as a spreadsheet does, counting comment and blank rows', () => {
			expectErrors('# note\nRegion,population\n\nNorth,lots\n', [
				'Row 4: "Size of population" must be a number, but is "lots".'
			]);
		});

		it('should report the row that is wrong and return no regions at all', () => {
			expectErrors('Region,population\nNorth,50000\nSouth,lots\n', [
				'Row 3: "Size of population" must be a number, but is "lots".'
			]);
		});

		it('should cap the number of reported problems', () => {
			const rows = Array.from({ length: 12 }, (_, index) => `Region ${index},lots`).join('\n');
			const { errors } = parseProjectCsv(`Region,population\n${rows}\n`, schema);

			expect(errors).toHaveLength(11);
			expect(errors[10]).toBe('...and 2 more problems.');
		});
	});
});

describe('buildProjectCsvTemplate', () => {
	const [header, help, allParameters, baselineOnly] = parseCsv(buildProjectCsvTemplate(schema));

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

	it('should keep lists in one cell however a spreadsheet splits cells', () => {
		const template = buildProjectCsvTemplate(schema);

		expect(template).toContain(',py_only|py_pbo,');
		expect(
			parseCsv(template, ';')
				.slice(2)
				.every((row) => row.length === 1)
		).toBe(true);
	});

	it('should describe ranges that are open at either end', () => {
		const openRanges = inlineSchema([
			{ id: 'at_least', label: 'At least', type: 'number', min: 1, default: 1 },
			{ id: 'at_most', label: 'At most', type: 'number', max: 9, default: 1, unit: '%' }
		]);

		expect(parseCsv(buildProjectCsvTemplate(openRanges))[1].slice(1)).toEqual([
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

		const [, help, example] = parseCsv(buildProjectCsvTemplate(dependencies));

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

		expect(parseCsv(buildProjectCsvTemplate(alwaysDisabled))[2]).toEqual(['Example region - all parameters', '1', '']);
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
