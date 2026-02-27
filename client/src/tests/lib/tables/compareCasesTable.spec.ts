import { renderComponent } from '$lib/components/ui/data-table';
import {
	buildCompareCasesTableData,
	compareCasesTableColumns,
	getCasesCell,
	getCasesHeader,
	getCostsHeader,
	getScenarioKeys
} from '$lib/tables/compareCasesTable';

vi.mock('$lib/charts/baseChart', () => ({
	ScenarioToLabel: {
		baseline: 'Baseline',
		intervention: 'Intervention'
	}
}));

vi.mock('$lib/components/data-table/DataTableSortHeader.svelte', () => ({
	default: 'DataTableSortHeader'
}));

vi.mock('$lib/components/ui/data-table', () => ({
	renderComponent: vi.fn(() => 'rendered-header')
}));

describe('compareCasesTable', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('getScenarioKeys returns unique scenarios preserving first-seen order', () => {
		const keys = getScenarioKeys(
			{ baseline: { totalCost: 1, totalCases: 2 } } as any,
			{ intervention: { totalCost: 3, totalCases: 4 }, baseline: { totalCost: 5, totalCases: 6 } } as any,
			{ intervention: { totalCost: 7, totalCases: 8 } } as any
		);

		expect(keys).toEqual(['baseline', 'intervention']);
	});

	it('buildCompareCasesTableData merges totals across all timeframes', () => {
		const data = buildCompareCasesTableData({
			presentTotals: {
				baseline: { totalCost: 100, totalCases: 10 }
			},
			baselineLongTermTotals: {
				baseline: { totalCost: 200, totalCases: 20 },
				intervention: { totalCost: 300, totalCases: 30 }
			},
			fullLongTermTotals: {
				intervention: { totalCost: 400, totalCases: 40 }
			}
		} as any);

		expect(data).toEqual([
			{
				intervention: 'Baseline',
				presentCost: 100,
				presentCases: 10,
				longTermBaselineCost: 200,
				longTermBaselineCases: 20,
				fullLongTermCost: undefined,
				fullLongTermCases: undefined
			},
			{
				intervention: 'Intervention',
				presentCost: undefined,
				presentCases: undefined,
				longTermBaselineCost: 300,
				longTermBaselineCases: 30,
				fullLongTermCost: 400,
				fullLongTermCases: 40
			}
		]);
	});

	it('getCasesCell formats numeric values and handles undefined', () => {
		const cell = getCasesCell().cell;
		expect(cell({ getValue: () => 1200 } as any)).toBe('1,200');
		expect(cell({ getValue: () => undefined } as any)).toBe('-');
	});

	it('getCasesHeader uses sortable header renderer with Cases label', () => {
		const onClick = vi.fn();
		const result = getCasesHeader().header({
			column: { getToggleSortingHandler: () => onClick }
		} as any);

		expect(result).toBe('rendered-header');
		expect(renderComponent).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				onclick: onClick,
				label: 'Cases'
			})
		);
	});

	it('getCostsHeader uses sortable header renderer with Cost label', () => {
		const onClick = vi.fn();
		const result = getCostsHeader().header({
			column: { getToggleSortingHandler: () => onClick }
		} as any);

		expect(result).toBe('rendered-header');
		expect(renderComponent).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				onclick: onClick,
				label: 'Cost'
			})
		);
	});

	it('compareCasesTableColumns contains expected top-level groups', () => {
		expect(compareCasesTableColumns.map((c: any) => c.header)).toEqual([
			'Intervention',
			'Present',
			'Long term (baseline only)',
			'Long term (baseline + control strategy)'
		]);
	});

	it('present cost cell formats as USD currency and supports undefined', () => {
		const presentGroup: any = compareCasesTableColumns.find((c: any) => c.accessorKey === 'present');
		const presentCostCol = presentGroup.columns.find((c: any) => c.accessorKey === 'presentCost');

		expect(presentCostCol.cell({ getValue: () => 1200 } as any)).toBe('$1,200');
		expect(presentCostCol.cell({ getValue: () => undefined } as any)).toBe('-');
	});

	it('intervention leaf column returns raw intervention label', () => {
		const interventionGroup: any = compareCasesTableColumns.find((c: any) => c.accessorKey === 'intervention');
		const leaf = interventionGroup.columns[0];

		expect(leaf.cell({ getValue: () => 'Baseline' } as any)).toBe('Baseline');
	});
});
