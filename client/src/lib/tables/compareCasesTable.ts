import { ScenarioToLabel } from '$lib/charts/baseChart';
import DataTableSortHeader from '$lib/components/data-table/DataTableSortHeader.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { roundNumber } from '$lib/number';
import type { CompareTotals } from '$lib/types/compare';
import type { Scenario } from '$lib/types/userState';
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';

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
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, number | undefined>) => {
		return renderComponent(DataTableSortHeader, {
			onclick: column.getToggleSortingHandler(),
			label: 'Cases'
		});
	}
});

export const casesCellSnippet = createRawSnippet<[{ value: number; percentageChange: number }]>((getProps) => {
	const { value, percentageChange } = getProps();
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'decimal',
		trailingZeroDisplay: 'stripIfInteger',
		maximumFractionDigits: 0
	});
	const percentageChangeText = percentageChange ? ` (${percentageChange >= 0 ? '+' : ''}${percentageChange}%)` : '';
	return {
		render: () =>
			`<span>${formatter.format(value)}<span class="text-xs text-muted-foreground">${percentageChangeText}</span></span>`
	};
});

export const getCasesCell = () => ({
	cell: ({ getValue, row, column }: CellContext<ComparisonTimeFramesData, number | undefined>) => {
		const cellValue = getValue();
		if (cellValue === undefined) return '-';

		let percentageChange = 0;
		if (column.id !== 'presentCases') {
			const presentCases = row.getValue('presentCases') as number;
			if (presentCases) {
				percentageChange = roundNumber(((cellValue - presentCases) / presentCases) * 100, 0);
			}
		}
		return renderSnippet(casesCellSnippet, {
			value: cellValue,
			percentageChange
		});
	}
});

export const getCostsHeader = () => ({
	header: ({ column }: HeaderContext<ComparisonTimeFramesData, number | undefined>) => {
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
		header: 'Present (current control strategy)',
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
		header: 'Long-term (current control strategy)',
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
		header: 'Long-term (adjusted control strategy)',
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

export const buildCompareCasesTableData = (
	{ presentTotals, baselineLongTermTotals, fullLongTermTotals }: CompareTotals,
	scenarios: Scenario[]
): ComparisonTimeFramesData[] =>
	scenarios.map((scenario) => ({
		intervention: ScenarioToLabel[scenario as Scenario],
		presentCost: presentTotals[scenario as Scenario]?.totalCost,
		presentCases: presentTotals[scenario as Scenario]?.totalCases,
		longTermBaselineCost: baselineLongTermTotals[scenario as Scenario]?.totalCost,
		longTermBaselineCases: baselineLongTermTotals[scenario as Scenario]?.totalCases,
		fullLongTermCost: fullLongTermTotals[scenario as Scenario]?.totalCost,
		fullLongTermCases: fullLongTermTotals[scenario as Scenario]?.totalCases
	}));
