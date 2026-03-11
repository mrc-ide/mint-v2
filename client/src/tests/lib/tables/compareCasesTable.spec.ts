import { ScenarioToLabel } from '$lib/charts/baseChart';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import {
	buildCompareCasesTableData,
	casesCellSnippet,
	compareCasesTableColumns,
	getCasesCell,
	getCasesHeader,
	getCostsHeader
} from '$lib/tables/compareCasesTable';
import type { Scenario } from '$lib/types/userState';
vi.mock('$lib/components/data-table/DataTableSortHeader.svelte', () => ({
	default: 'DataTableSortHeader'
}));

vi.mock('$lib/components/ui/data-table', () => ({
	renderComponent: vi.fn(() => 'rendered-header'),
	renderSnippet: vi.fn(() => 'rendered-cell')
}));

// const hoisted = vi.hoisted(() => ({
// 	rawSnippetRef: { render: () => '<span />' }
// }));

// vi.mock('svelte', () => ({
// 	createRawSnippet: vi.fn(() => hoisted.rawSnippetRef)
// }));

describe('compareCasesTable', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	const scenarios = ['no_intervention', 'lsm_only'] as Scenario[];

	it('buildCompareCasesTableData merges totals across all timeframes', () => {
		const data = buildCompareCasesTableData(
			{
				presentTotals: {
					no_intervention: { totalCost: 100, totalCases: 10 }
				},
				baselineLongTermTotals: {
					no_intervention: { totalCost: 200, totalCases: 20 },
					lsm_only: { totalCost: 300, totalCases: 30 }
				},
				fullLongTermTotals: {
					lsm_only: { totalCost: 400, totalCases: 40 }
				}
			} as any,
			scenarios
		);

		expect(data).toEqual([
			{
				intervention: ScenarioToLabel['no_intervention'],
				presentCost: 100,
				presentCases: 10,
				longTermBaselineCost: 200,
				longTermBaselineCases: 20,
				fullLongTermCost: undefined,
				fullLongTermCases: undefined
			},
			{
				intervention: ScenarioToLabel['lsm_only'],
				presentCost: undefined,
				presentCases: undefined,
				longTermBaselineCost: 300,
				longTermBaselineCases: 30,
				fullLongTermCost: 400,
				fullLongTermCases: 40
			}
		]);
	});

	describe('getCasesCell', () => {
		it('getCasesCell handles undefined', () => {
			const cell = getCasesCell().cell;
			expect(cell({ getValue: () => undefined } as any)).toBe('-');
		});
		it('should handle presentCases with no percentage', () => {
			const cell = getCasesCell().cell;
			const result = cell({ getValue: () => 1000, column: { id: 'presentCases' } } as any);

			expect(vi.mocked(renderSnippet)).toHaveBeenCalledWith(casesCellSnippet, {
				value: 1000,
				percentageChange: 0
			});
			expect(result).toBe('rendered-cell');
		});
		it('should handle not presentCases with percentage', () => {
			const cell = getCasesCell().cell;
			const result = cell({
				getValue: () => 1000,
				column: { id: 'longTermBaselineCases' },
				row: { getValue: () => 800 }
			} as any);

			expect(vi.mocked(renderSnippet)).toHaveBeenCalledWith(casesCellSnippet, {
				value: 1000,
				percentageChange: 25
			});
			expect(result).toBe('rendered-cell');
		});
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
