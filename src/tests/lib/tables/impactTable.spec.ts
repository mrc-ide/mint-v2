import { renderComponent } from '$lib/components/ui/data-table';
import { impactTableColumns } from '$lib/tables/impactTable';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';

vi.mock('$lib/components/ui/data-table', () => ({
	renderComponent: vi.fn()
}));

vi.mock(import('$lib/components/data-table/DataTableSortHeader.svelte'), () => ({
	default: vi.fn()
}));

describe('impactTableColumns', () => {
	it('should have correct number of columns', () => {
		expect(impactTableColumns).toHaveLength(8);
	});

	it('should have correct accessor keys', () => {
		const accessorKeys = (impactTableColumns as any[]).map((col) => col.accessorKey);
		expect(accessorKeys).toEqual([
			'intervention',
			'casesAvertedMeanPer1000',
			'casesAvertedYear1Per1000',
			'casesAvertedYear2Per1000',
			'casesAvertedYear3Per1000',
			'relativeReductionInCases',
			'meanCasesPerYearPerPerson',
			'relativeReductionInPrevalence'
		]);
	});

	describe('cell formatting', () => {
		it('should return string values unchanged for intervention column', () => {
			const interventionColumn = impactTableColumns[0];
			const cellRenderer = interventionColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue('Test Intervention');

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('Test Intervention');
		});

		it('should return "-" for undefined values', () => {
			const casesColumn = impactTableColumns[1];
			const cellRenderer = casesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(undefined);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('-');
		});

		it('should return "-" for null values', () => {
			const casesColumn = impactTableColumns[1];
			const cellRenderer = casesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(null);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('-');
		});

		it('should format decimal values with 1 fractional digit for casesAvertedMeanPer1000', () => {
			const casesColumn = impactTableColumns[1];
			const cellRenderer = casesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(12.567);

			const result = cellRenderer({ getValue: mockGetValue } as any);

			expect(result).toBe('12.6');
		});

		it('should format decimal values with 1 fractional digit for casesAvertedYear1Per1000', () => {
			const year1Column = impactTableColumns[2];
			const cellRenderer = year1Column.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(15.23);

			const result = cellRenderer({ getValue: mockGetValue } as any);

			expect(result).toBe('15.2');
		});

		it('should format decimal values with 1 fractional digit for casesAvertedYear2Per1000', () => {
			const year2Column = impactTableColumns[3];
			const cellRenderer = year2Column.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(18.789);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('18.8');
		});

		it('should format decimal values with 1 fractional digit for casesAvertedYear3Per1000', () => {
			const year3Column = impactTableColumns[4];
			const cellRenderer = year3Column.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(22.456);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('22.5');
		});

		it('should format percent values correctly for relativeReductionInCases', () => {
			const reductionColumn = impactTableColumns[5];
			const cellRenderer = reductionColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(25.67);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('25.7%');
		});

		it('should format decimal values with 2 fractional digits for meanCasesPerYearPerPerson', () => {
			const meanCasesColumn = impactTableColumns[6];
			const cellRenderer = meanCasesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(0.12567);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('0.13');
		});

		it('should format percent values correctly for relativeReductionInPrevalence', () => {
			const prevalenceColumn = impactTableColumns[7];
			const cellRenderer = prevalenceColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(35.234);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('35.2%');
		});

		it('should convert percent values by dividing by 100', () => {
			const reductionColumn = impactTableColumns[5];
			const cellRenderer = reductionColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(100);

			const result = cellRenderer({ getValue: mockGetValue } as any);

			expect(result).toBe('100.0%');
		});
	});

	describe('header rendering', () => {
		it('should render header correctly', () => {
			const interventionColumn = impactTableColumns[0];
			const headerRenderer = interventionColumn.header as any;
			const mockToggleSortingHandler = vi.fn();
			const mockColumn = {
				getToggleSortingHandler: vi.fn().mockReturnValue(mockToggleSortingHandler)
			};

			headerRenderer({ column: mockColumn });

			expect(renderComponent).toHaveBeenCalledWith(DataTableSortHeader, {
				onclick: mockToggleSortingHandler,
				label: expect.any(String),
				helpText: undefined
			});

			expect(mockColumn.getToggleSortingHandler).toHaveBeenCalled();
		});
	});
});
