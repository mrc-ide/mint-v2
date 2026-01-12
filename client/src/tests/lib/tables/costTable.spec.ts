import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent } from '$lib/components/ui/data-table';
import { costTableColumns } from '$lib/tables/costTable';

vi.mock('$lib/components/ui/data-table', () => ({
	renderComponent: vi.fn()
}));

vi.mock(import('$lib/components/data-table/DataTableSortHeader.svelte'), () => ({
	default: vi.fn()
}));

describe('costTableColumns', () => {
	it('should have correct accessor keys', () => {
		const accessorKeys = (costTableColumns as any[]).map((col) => col.accessorKey);
		expect(accessorKeys).toEqual(['intervention', 'casesAvertedTotal', 'totalCost', 'costPerCaseAverted']);
	});

	describe('cell formatting', () => {
		it('should return string values unchanged for intervention column', () => {
			const interventionColumn = costTableColumns[0];
			const cellRenderer = interventionColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue('Test Intervention');

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('Test Intervention');
		});

		it('should format decimal values correctly for casesAvertedTotal', () => {
			const casesColumn = costTableColumns[1];
			const cellRenderer = casesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(1234.567);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('1,234.57');
		});

		it('should format currency values correctly for totalCost', () => {
			const totalCostColumn = costTableColumns[2];
			const cellRenderer = totalCostColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(50000.75);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('$50,000.75');
		});

		it('should format currency values correctly for costPerCaseAverted', () => {
			const costPerCaseColumn = costTableColumns[3];
			const cellRenderer = costPerCaseColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(125.5);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('$125.50');
		});

		it('should strip trailing zeros for integer values', () => {
			const totalCostColumn = costTableColumns[2];
			const cellRenderer = totalCostColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(1000);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('$1,000');
		});

		it('should handle zero values correctly', () => {
			const casesColumn = costTableColumns[1];
			const cellRenderer = casesColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(0);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('0');
		});

		it('should handle large numbers correctly', () => {
			const totalCostColumn = costTableColumns[2];
			const cellRenderer = totalCostColumn.cell as any;
			const mockGetValue = vi.fn().mockReturnValue(1234567.89);

			const result = cellRenderer({ getValue: mockGetValue });

			expect(result).toBe('$1,234,567.89');
		});
	});

	describe('header rendering', () => {
		it('should render header correctly', () => {
			const interventionColumn = costTableColumns[0];
			const headerRenderer = interventionColumn.header as any;
			const mockToggleSortingHandler = vi.fn();
			const mockColumn = {
				getToggleSortingHandler: vi.fn().mockReturnValue(mockToggleSortingHandler)
			};

			headerRenderer({ column: mockColumn });

			expect(renderComponent).toHaveBeenCalledWith(DataTableSortHeader, {
				onclick: mockToggleSortingHandler,
				helpText: undefined,
				label: expect.any(String)
			});
			expect(mockColumn.getToggleSortingHandler).toHaveBeenCalled();
		});
	});
});
