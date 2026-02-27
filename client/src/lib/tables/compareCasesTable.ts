import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent } from '$lib/components/ui/data-table';
import { type ScenarioTotals } from '$lib/process-results/processCases';
import type { Scenario } from '$lib/types/userState';
import type { CompareTotals } from '$routes/projects/[project]/regions/[region]/compare/_components/CompareResults.svelte';
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/table-core';

export interface ComparisonTimeFramesData {
	intervention: string;
	presentCost?: number;
	presentCases?: number;
	longTermBaselineCost?: number;
	longTermBaselineCases?: number;
	fullLongTermCost?: number;
	fullLongTermCases?: number;
}

export const getCasesHeader = () => ({
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, string>) => {
		return renderComponent(DataTableSortHeader, {
			onclick: column.getToggleSortingHandler(),
			label: 'Cases'
		});
	}
});

export const getCasesCell = () => ({
	cell: ({ getValue }: CellContext<ComparisonTimeFramesData, number | undefined>) => {
		const cellValue = getValue();
		if (cellValue === undefined) return '-';

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'decimal',
			trailingZeroDisplay: 'stripIfInteger',
			maximumFractionDigits: 0
		});
		return formatter.format(cellValue);
	}
});

export const getCostsHeader = () => ({
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, string>) => {
		return renderComponent(DataTableSortHeader, {
			onclick: column.getToggleSortingHandler(),
			label: 'Cost'
		});
	}
});
const getCostsCell = () => ({
	cell: ({ getValue }: CellContext<ComparisonTimeFramesData, number | undefined>) => {
		const value = getValue();
		if (value === undefined) return '-';

		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			trailingZeroDisplay: 'stripIfInteger',
			currency: 'USD',
			maximumFractionDigits: 0
		});
		return formatter.format(value);
	}
});

export const compareCasesTableColumns: ColumnDef<ComparisonTimeFramesData>[] = [
	{
		accessorKey: 'intervention',
		header: 'Intervention',
		columns: [
			{
				accessorKey: 'intervention',
				cell: ({ getValue }) => getValue(),
				header: undefined
			}
		]
	},
	{
		accessorKey: 'present',
		header: 'Present',
		columns: [
			{
				accessorKey: 'presentCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'presentCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
	},
	{
		accessorKey: 'longTermBaseline',
		header: 'Long term (baseline only)',
		columns: [
			{
				accessorKey: 'longTermBaselineCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'longTermBaselineCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
	},
	{
		accessorKey: 'fullLongTerm',
		header: 'Long term (baseline + control strategy)',
		columns: [
			{
				accessorKey: 'fullLongTermCases',
				...getCasesHeader(),
				...getCasesCell()
			},
			{
				accessorKey: 'fullLongTermCost',
				...getCostsHeader(),
				...getCostsCell()
			}
		]
	}
];

export const getScenarioKeys = (...totalsByTImeFrames: Partial<Record<Scenario, ScenarioTotals>>[]): Scenario[] =>
	Array.from(new Set(totalsByTImeFrames.flatMap((summary) => Object.keys(summary) as Scenario[])));

export const buildCompareCasesTableData = ({
	presentTotals,
	baselineLongTermTotals,
	fullLongTermTotals
}: CompareTotals): ComparisonTimeFramesData[] => {
	const scenarios = getScenarioKeys(presentTotals, baselineLongTermTotals, fullLongTermTotals);

	return scenarios.map((scenario) => ({
		intervention: ScenarioToLabel[scenario as Scenario],
		presentCost: presentTotals[scenario as Scenario]?.totalCost,
		presentCases: presentTotals[scenario as Scenario]?.totalCases,
		longTermBaselineCost: baselineLongTermTotals[scenario as Scenario]?.totalCost,
		longTermBaselineCases: baselineLongTermTotals[scenario as Scenario]?.totalCases,
		fullLongTermCost: fullLongTermTotals[scenario as Scenario]?.totalCost,
		fullLongTermCases: fullLongTermTotals[scenario as Scenario]?.totalCases
	}));
};
